import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  SubscriptionStatusResponse,
  BillingApiError,
  Subscription,
  UsageMetrics,
  Plan,
} from "../types";
import { isRetryableError } from "./use-retry";

// Query key factory for subscription-related queries
export const subscriptionKeys = {
  all: ["subscription"] as const,
  status: () => [...subscriptionKeys.all, "status"] as const,
  urls: () => [...subscriptionKeys.all, "urls"] as const,
};

// Hook configuration options
interface UseSubscriptionOptions {
  /**
   * Enable real-time polling for subscription status updates
   * @default true
   */
  enablePolling?: boolean;
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  pollingInterval?: number;
  /**
   * Retry failed requests
   * @default true
   */
  retry?: boolean;
  /**
   * Number of retry attempts
   * @default 3
   */
  retryAttempts?: number;
  /**
   * Enable background refetch when window regains focus
   * @default true
   */
  refetchOnWindowFocus?: boolean;
}

// Hook return type
interface UseSubscriptionReturn {
  // Data
  subscription: Subscription | null;
  usageMetrics: UsageMetrics | undefined;
  availablePlans: Plan[] | undefined;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isRefetching: boolean;

  // Error states
  error: BillingApiError | null;
  isError: boolean;

  // Actions
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;

  // Status helpers
  hasActiveSubscription: boolean;
  isSubscriptionActive: boolean;
  isSubscriptionCancelled: boolean;
  isSubscriptionTrial: boolean;
  isSubscriptionExpired: boolean;
}

/**
 * Fetch subscription status from the API
 */
async function fetchSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  // Get session token from Shopify App Bridge or localStorage
  const sessionToken =
    (window as any)?.shopify?.sessionToken ||
    localStorage.getItem("shopify-session-token") ||
    sessionStorage.getItem("shopify-session-token");

  if (!sessionToken) {
    throw new Error("No session token available. Please re-authenticate.");
  }

  const response = await fetch("/api/billing/subscription-status", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-shopify-session-token": sessionToken,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    if (errorData && "error" in errorData) {
      throw errorData as BillingApiError;
    }

    // Fallback error for non-JSON responses
    throw {
      error: {
        code: `HTTP_${response.status}`,
        message: `Request failed with status ${response.status}: ${response.statusText}`,
      },
      timestamp: new Date().toISOString(),
    } as BillingApiError;
  }

  const data = await response.json();
  return data as SubscriptionStatusResponse;
}

/**
 * Custom hook for managing subscription data with React Query
 *
 * Features:
 * - Automatic data fetching with caching
 * - Real-time polling for subscription updates
 * - Error handling with retry logic
 * - Loading state management
 * - Manual refresh capabilities
 * - Subscription status helpers
 *
 * @param options - Configuration options for the hook
 * @returns Subscription data, loading states, error states, and utility functions
 */
export function useSubscription(
  options: UseSubscriptionOptions = {},
): UseSubscriptionReturn {
  const {
    enablePolling = true,
    pollingInterval = 30000, // 30 seconds
    retry = true,
    retryAttempts = 3,
    refetchOnWindowFocus = true,
  } = options;

  const queryClient = useQueryClient();

  // State for enhanced error handling
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);

  // Main subscription query
  const {
    data,
    isLoading,
    isFetching,
    isRefetching,
    error,
    isError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: fetchSubscriptionStatus,

    // Caching configuration
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache for 30 minutes

    // Polling configuration
    refetchInterval: enablePolling ? pollingInterval : false,
    refetchIntervalInBackground: false, // Only poll when tab is active

    // Enhanced retry configuration
    retry: (failureCount, error) => {
      // Don't retry if we've exceeded max attempts
      if (failureCount >= retryAttempts) {
        return false;
      }

      // Don't retry authentication errors
      const billingError = error as unknown as BillingApiError;
      if (billingError?.error?.code) {
        const nonRetryableCodes = [
          "MISSING_SESSION_TOKEN",
          "INVALID_SESSION",
          "SESSION_NOT_FOUND",
          "APP_NOT_INSTALLED",
          "INVALID_SHOP_DOMAIN",
        ];
        if (nonRetryableCodes.includes(billingError.error.code)) {
          return false;
        }
      }

      // Use our retry logic for other errors
      return retry && isRetryableError(error);
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter
      const baseDelay = 1000 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      return Math.min(baseDelay + jitter, 30000);
    },

    // Refetch configuration
    refetchOnWindowFocus,
    refetchOnMount: true,
    refetchOnReconnect: true,

    // Error handling
    throwOnError: false, // Handle errors in the hook rather than throwing

    // Network mode - continue to show cached data when offline
    networkMode: "offlineFirst",

    // Meta data for error tracking
    meta: {
      errorMessage: "Failed to fetch subscription data",
    },
  });

  // Extract data from response
  const subscription = data?.subscription || null;
  const usageMetrics = data?.usageMetrics;
  const availablePlans = data?.availablePlans;

  // Subscription status helpers
  const hasActiveSubscription = Boolean(subscription);
  const isSubscriptionActive = subscription?.status === "active";
  const isSubscriptionCancelled = subscription?.status === "cancelled";
  const isSubscriptionTrial = subscription?.status === "trial";
  const isSubscriptionExpired = subscription?.status === "expired";

  // Manual refetch function
  const refetch = useCallback(async () => {
    try {
      await queryRefetch();
    } catch (error) {
      console.error("Failed to refetch subscription data:", error);
    }
  }, [queryRefetch]);

  // Invalidate and refetch function
  const invalidate = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: subscriptionKeys.status(),
      });
    } catch (error) {
      console.error("Failed to invalidate subscription data:", error);
    }
  }, [queryClient]);

  // Set up polling interval adjustment based on subscription status
  useEffect(() => {
    if (!enablePolling) return;

    // Adjust polling frequency based on subscription status
    let adjustedInterval = pollingInterval;

    if (subscription?.status === "pending") {
      // Poll more frequently for pending subscriptions
      adjustedInterval = 10000; // 10 seconds
    } else if (
      subscription?.status === "cancelled" ||
      subscription?.status === "expired"
    ) {
      // Poll less frequently for inactive subscriptions
      adjustedInterval = 60000; // 1 minute
    }

    // Note: React Query doesn't support dynamic interval changes directly
    // This is handled by the refetchInterval option in the query configuration
  }, [subscription?.status, enablePolling, pollingInterval]);

  // Handle session token changes (e.g., after re-authentication)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "shopify-session-token" && event.newValue) {
        // Session token updated, refetch subscription data
        refetch();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refetch]);

  // Handle Shopify App Bridge session token updates
  useEffect(() => {
    const handleShopifySessionUpdate = () => {
      if ((window as any)?.shopify?.sessionToken) {
        refetch();
      }
    };

    // Listen for Shopify App Bridge events
    if ((window as any)?.shopify) {
      (window as any).shopify.on?.(
        "session:update",
        handleShopifySessionUpdate,
      );

      return () => {
        (window as any).shopify.off?.(
          "session:update",
          handleShopifySessionUpdate,
        );
      };
    }
  }, [refetch]);

  return {
    // Data
    subscription,
    usageMetrics,
    availablePlans,

    // Loading states
    isLoading,
    isFetching,
    isRefetching,

    // Error states
    error: error as BillingApiError | null,
    isError,

    // Actions
    refetch,
    invalidate,

    // Status helpers
    hasActiveSubscription,
    isSubscriptionActive,
    isSubscriptionCancelled,
    isSubscriptionTrial,
    isSubscriptionExpired,
  };
}

/**
 * Hook for prefetching subscription data
 * Useful for preloading data before navigating to the billing page
 */
export function usePrefetchSubscription() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: subscriptionKeys.status(),
      queryFn: fetchSubscriptionStatus,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }, [queryClient]);
}

/**
 * Hook for subscription data mutations (refresh after external changes)
 * This can be used after returning from Shopify billing pages
 */
export function useSubscriptionMutations() {
  const queryClient = useQueryClient();

  const refreshAfterExternalChange = useCallback(async () => {
    // Invalidate all subscription-related queries
    await queryClient.invalidateQueries({
      queryKey: subscriptionKeys.all,
    });

    // Refetch immediately
    await queryClient.refetchQueries({
      queryKey: subscriptionKeys.status(),
    });
  }, [queryClient]);

  const updateSubscriptionCache = useCallback(
    (newData: SubscriptionStatusResponse) => {
      queryClient.setQueryData(subscriptionKeys.status(), newData);
    },
    [queryClient],
  );

  return {
    refreshAfterExternalChange,
    updateSubscriptionCache,
  };
}

// subscriptionKeys is already exported above
