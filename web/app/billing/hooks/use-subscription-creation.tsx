import { useState, useCallback } from "react";
import { BillingApiError } from "../types";

interface UseSubscriptionCreationOptions {
  /**
   * Callback function called when subscription creation is successful
   */
  onSuccess?: (subscriptionUrl: string) => void;
  /**
   * Callback function called when subscription creation fails
   */
  onError?: (error: BillingApiError) => void;
  /**
   * Return URL after subscription completion
   */
  returnUrl?: string;
}

interface UseSubscriptionCreationReturn {
  /**
   * Create a subscription for the specified plan
   */
  createSubscription: (planId: string) => Promise<void>;
  /**
   * Whether a subscription creation is in progress
   */
  isCreating: boolean;
  /**
   * Error from the last subscription creation attempt
   */
  error: BillingApiError | null;
  /**
   * Clear the current error state
   */
  clearError: () => void;
}

/**
 * Create a subscription URL for the specified plan
 */
async function createSubscriptionUrl(
  planId: string,
  returnUrl?: string,
): Promise<string> {
  // Get session token from Shopify App Bridge or localStorage
  const sessionToken =
    (window as any)?.shopify?.sessionToken ||
    localStorage.getItem("shopify-session-token") ||
    sessionStorage.getItem("shopify-session-token");

  if (!sessionToken) {
    throw new Error("No session token available. Please re-authenticate.");
  }

  // Prepare request body with plan-specific subscription details
  const requestBody = {
    planId,
    returnUrl: returnUrl || `${window.location.origin}/billing/callback`,
    generateDynamic: true,
  };

  const response = await fetch("/api/billing/create-subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-shopify-session-token": sessionToken,
    },
    body: JSON.stringify(requestBody),
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

  if (!data.subscriptionUrl) {
    throw {
      error: {
        code: "MISSING_SUBSCRIPTION_URL",
        message: "No subscription URL returned from the server.",
      },
      timestamp: new Date().toISOString(),
    } as BillingApiError;
  }

  return data.subscriptionUrl;
}

/**
 * Custom hook for handling subscription creation
 *
 * This hook provides functionality to create subscriptions for unsubscribed users.
 * It handles the API call to create a subscription URL and redirects the user
 * to Shopify's subscription flow.
 *
 * @param options - Configuration options for the hook
 * @returns Subscription creation functions and state
 */
export function useSubscriptionCreation(
  options: UseSubscriptionCreationOptions = {},
): UseSubscriptionCreationReturn {
  const { onSuccess, onError, returnUrl } = options;

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<BillingApiError | null>(null);

  const createSubscription = useCallback(
    async (planId: string) => {
      try {
        setIsCreating(true);
        setError(null);

        // Create subscription URL
        const subscriptionUrl = await createSubscriptionUrl(planId, returnUrl);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(subscriptionUrl);
        }

        // Redirect to Shopify subscription flow
        window.location.href = subscriptionUrl;
      } catch (error) {
        console.error("Failed to create subscription:", error);

        const billingError = error as BillingApiError;
        setError(billingError);

        // Call error callback if provided
        if (onError) {
          onError(billingError);
        }
      } finally {
        setIsCreating(false);
      }
    },
    [onSuccess, onError, returnUrl],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createSubscription,
    isCreating,
    error,
    clearError,
  };
}

/**
 * Hook for handling subscription creation with automatic error handling
 * This is a simplified version that shows error messages automatically
 */
export function useSubscriptionCreationWithToast(
  options: Omit<UseSubscriptionCreationOptions, "onError"> = {},
) {
  const [toastError, setToastError] = useState<string | null>(null);

  const subscriptionCreation = useSubscriptionCreation({
    ...options,
    onError: (error) => {
      setToastError(error.error.message);
    },
  });

  const clearToastError = useCallback(() => {
    setToastError(null);
    subscriptionCreation.clearError();
  }, [subscriptionCreation]);

  return {
    ...subscriptionCreation,
    toastError,
    clearToastError,
  };
}
