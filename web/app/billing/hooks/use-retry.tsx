"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Banner,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
} from "@shopify/polaris";
import { BillingApiError } from "../types";

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: any;
  canRetry: boolean;
}

interface UseRetryReturn {
  retry: () => Promise<void>;
  reset: () => void;
  state: RetryState;
}

/**
 * Custom hook for implementing retry logic with exponential backoff
 */
export function useRetry(
  asyncFunction: () => Promise<any>,
  options: RetryOptions = {},
): UseRetryReturn {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = (error) => {
      // Default retry condition: retry on network errors and 5xx server errors
      if (error?.error?.code) {
        const code = error.error.code;
        return (
          code === "NETWORK_ERROR" ||
          code === "INTERNAL_ERROR" ||
          code === "GRAPHQL_ERROR" ||
          code.startsWith("HTTP_5")
        );
      }
      return true;
    },
    onRetry,
    onMaxAttemptsReached,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
    canRetry: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculateDelay = useCallback(
    (attempt: number): number => {
      const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
      return Math.min(delay, maxDelay);
    },
    [initialDelay, backoffFactor, maxDelay],
  );

  const retry = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;

    const nextAttempt = state.attemptCount + 1;

    // Check if we've exceeded max attempts
    if (nextAttempt > maxAttempts) {
      setState((prev) => ({
        ...prev,
        canRetry: false,
      }));

      if (onMaxAttemptsReached && state.lastError) {
        onMaxAttemptsReached(state.lastError);
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      isRetrying: true,
      attemptCount: nextAttempt,
    }));

    try {
      // Calculate delay for this attempt
      const delay = calculateDelay(nextAttempt);

      // Wait before retrying (except for first attempt)
      if (nextAttempt > 1) {
        await new Promise((resolve) => {
          timeoutRef.current = setTimeout(resolve, delay);
        });
      }

      // Check if component is still mounted
      if (!mountedRef.current) return;

      // Execute the async function
      await asyncFunction();

      // Success - reset state
      if (mountedRef.current) {
        setState({
          isRetrying: false,
          attemptCount: 0,
          lastError: null,
          canRetry: true,
        });
      }
    } catch (error) {
      if (!mountedRef.current) return;

      console.error(`Retry attempt ${nextAttempt} failed:`, error);

      // Check if we should retry this error
      const shouldRetry = retryCondition(error);

      setState((prev) => ({
        ...prev,
        isRetrying: false,
        lastError: error,
        canRetry: shouldRetry && nextAttempt < maxAttempts,
      }));

      // Call retry callback
      if (onRetry) {
        onRetry(nextAttempt, error);
      }

      // If we can't retry or have reached max attempts, call max attempts callback
      if (!shouldRetry || nextAttempt >= maxAttempts) {
        if (onMaxAttemptsReached) {
          onMaxAttemptsReached(error);
        }
      }

      // Re-throw the error so the caller can handle it
      throw error;
    }
  }, [
    state.attemptCount,
    state.lastError,
    maxAttempts,
    asyncFunction,
    calculateDelay,
    retryCondition,
    onRetry,
    onMaxAttemptsReached,
  ]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null,
      canRetry: true,
    });
  }, []);

  return {
    retry,
    reset,
    state,
  };
}

/**
 * Hook for retrying API calls with specific error handling for billing APIs
 */
export function useBillingApiRetry(
  apiCall: () => Promise<any>,
  options: Omit<RetryOptions, "retryCondition"> & {
    retryCondition?: (error: BillingApiError) => boolean;
  } = {},
) {
  const {
    retryCondition = (error: BillingApiError) => {
      // Retry on specific billing API error codes
      const retryableCodes = [
        "NETWORK_ERROR",
        "INTERNAL_ERROR",
        "GRAPHQL_ERROR",
        "SESSION_EXPIRED", // Might be temporary
        "RATE_LIMITED",
        "SERVICE_UNAVAILABLE",
      ];

      return retryableCodes.includes(error.error?.code || "");
    },
    ...restOptions
  } = options;

  return useRetry(apiCall, {
    ...restOptions,
    retryCondition,
  });
}

/**
 * Hook for automatic retry with React Query integration
 */
export function useQueryRetry(
  queryFn: () => Promise<any>,
  options: RetryOptions = {},
) {
  const retryHook = useRetry(queryFn, options);

  // Enhanced retry function that works well with React Query
  const retryWithQuery = useCallback(async () => {
    try {
      await retryHook.retry();
    } catch (error) {
      // Let React Query handle the error
      throw error;
    }
  }, [retryHook]);

  return {
    ...retryHook,
    retry: retryWithQuery,
  };
}

/**
 * Component for displaying retry information and controls
 */
interface RetryControlsProps {
  retryState: RetryState;
  onRetry: () => void;
  onReset?: () => void;
  maxAttempts?: number;
  showDetails?: boolean;
}

export function RetryControls({
  retryState,
  onRetry,
  onReset,
  maxAttempts = 3,
  showDetails = false,
}: RetryControlsProps) {
  const { isRetrying, attemptCount, canRetry, lastError } = retryState;

  if (attemptCount === 0 && !lastError) {
    return null;
  }

  return (
    <div style={{ marginTop: "16px" }}>
      {showDetails && (
        <div style={{ marginBottom: "12px", fontSize: "14px", color: "#666" }}>
          {attemptCount > 0 && (
            <div>
              Retry attempts: {attemptCount} / {maxAttempts}
            </div>
          )}
          {lastError && (
            <div style={{ color: "#d72c0d" }}>
              Last error: {lastError.error?.message || "Unknown error"}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              padding: "8px 16px",
              backgroundColor: "#008060",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isRetrying ? "not-allowed" : "pointer",
              opacity: isRetrying ? 0.6 : 1,
            }}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        )}

        {onReset && attemptCount > 0 && (
          <button
            onClick={onReset}
            disabled={isRetrying}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f6f6f7",
              color: "#202223",
              border: "1px solid #c9cccf",
              borderRadius: "4px",
              cursor: isRetrying ? "not-allowed" : "pointer",
              opacity: isRetrying ? 0.6 : 1,
            }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // Billing API errors
  if (error?.error?.code) {
    const retryableCodes = [
      "NETWORK_ERROR",
      "INTERNAL_ERROR",
      "GRAPHQL_ERROR",
      "RATE_LIMITED",
      "SERVICE_UNAVAILABLE",
      "TIMEOUT",
    ];
    return retryableCodes.includes(error.error.code);
  }

  // HTTP status codes
  if (error?.status) {
    // Retry on 5xx server errors and some 4xx errors
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }

  return false;
}

/**
 * Utility function to get user-friendly error message
 */
export function getRetryErrorMessage(error: any, attemptCount: number): string {
  const baseMessage =
    error?.error?.message || error?.message || "Unknown error";

  if (attemptCount === 0) {
    return baseMessage;
  }

  return `${baseMessage} (Attempt ${attemptCount})`;
}

/**
 * Enhanced error message generator with user-friendly descriptions
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Handle billing API errors
  if (error?.error?.code) {
    const code = error.error.code;
    const message = error.error.message;

    switch (code) {
      case "NETWORK_ERROR":
        return "Unable to connect to our servers. Please check your internet connection and try again.";
      case "SESSION_EXPIRED":
      case "INVALID_SESSION":
      case "MISSING_SESSION_TOKEN":
        return "Your session has expired. Please refresh the page and try again.";
      case "APP_NOT_INSTALLED":
        return "The app is not properly installed. Please reinstall the app or contact support.";
      case "RATE_LIMITED":
        return "Too many requests. Please wait a moment and try again.";
      case "SERVICE_UNAVAILABLE":
        return "Our billing service is temporarily unavailable. Please try again in a few minutes.";
      case "INTERNAL_ERROR":
        return "An internal error occurred. Our team has been notified. Please try again or contact support.";
      case "INVALID_SHOP_DOMAIN":
        return "Invalid shop domain. Please contact support for assistance.";
      case "SUBSCRIPTION_NOT_FOUND":
        return "Subscription not found. Please refresh the page or contact support.";
      case "PLAN_NOT_FOUND":
        return "The selected plan is no longer available. Please refresh the page and try again.";
      case "PAYMENT_REQUIRED":
        return "Payment is required to continue. Please update your payment method.";
      case "SUBSCRIPTION_CANCELLED":
        return "This subscription has been cancelled. Please create a new subscription.";
      default:
        return (
          message ||
          "An unexpected error occurred. Please try again or contact support."
        );
    }
  }

  // Handle HTTP errors
  if (error?.status) {
    switch (error.status) {
      case 400:
        return "Invalid request. Please refresh the page and try again.";
      case 401:
        return "Authentication required. Please refresh the page and try again.";
      case 403:
        return "Access denied. Please contact support for assistance.";
      case 404:
        return "The requested resource was not found. Please refresh the page.";
      case 408:
        return "Request timeout. Please check your connection and try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error. Our team has been notified. Please try again later.";
      case 502:
      case 503:
      case 504:
        return "Service temporarily unavailable. Please try again in a few minutes.";
      default:
        return `Server error (${error.status}). Please try again or contact support.`;
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Network connection error. Please check your internet connection and try again.";
  }

  // Fallback to original message or generic error
  return (
    error?.message ||
    "An unexpected error occurred. Please try again or contact support."
  );
}

/**
 * Hook for enhanced error handling with user-friendly messages
 */
export function useEnhancedErrorHandling() {
  const [lastError, setLastError] = React.useState<any>(null);
  const [userFriendlyMessage, setUserFriendlyMessage] = React.useState<
    string | null
  >(null);

  const handleError = React.useCallback((error: any) => {
    setLastError(error);
    setUserFriendlyMessage(getUserFriendlyErrorMessage(error));
    console.error("Enhanced error handler:", error);
  }, []);

  const clearError = React.useCallback(() => {
    setLastError(null);
    setUserFriendlyMessage(null);
  }, []);

  return {
    lastError,
    userFriendlyMessage,
    handleError,
    clearError,
  };
}

/**
 * Component for displaying enhanced error messages with support contact
 */
interface EnhancedErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onClear?: () => void;
  supportEmail?: string;
  showTechnicalDetails?: boolean;
  retryAttempts?: number;
  maxRetryAttempts?: number;
}

export function EnhancedErrorDisplay({
  error,
  onRetry,
  onClear,
  supportEmail = "support@example.com",
  showTechnicalDetails = false,
  retryAttempts = 0,
  maxRetryAttempts = 3,
}: EnhancedErrorDisplayProps) {
  const userFriendlyMessage = getUserFriendlyErrorMessage(error);
  const canRetry = onRetry && retryAttempts < maxRetryAttempts;

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Billing Error Report");
    const body = encodeURIComponent(
      `I encountered an error on the billing page:\n\n` +
        `User-friendly message: ${userFriendlyMessage}\n` +
        `Technical error: ${error?.error?.message || error?.message || "Unknown error"}\n` +
        `Error code: ${error?.error?.code || "N/A"}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Retry attempts: ${retryAttempts}/${maxRetryAttempts}\n` +
        `User Agent: ${navigator.userAgent}\n\n` +
        `Please help me resolve this issue.`,
    );

    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <Banner tone="critical">
      <BlockStack gap="300">
        <Text variant="bodyMd" as="p">
          {userFriendlyMessage}
        </Text>

        {retryAttempts > 0 && (
          <Text variant="bodySm" as="p" tone="subdued">
            Retry attempts: {retryAttempts} of {maxRetryAttempts}
          </Text>
        )}

        {showTechnicalDetails && error && (
          <Box
            padding="200"
            background="bg-fill-critical-secondary"
            borderRadius="100"
          >
            <Text variant="bodySm" as="p" tone="subdued">
              Technical details:{" "}
              {error?.error?.message || error?.message || "Unknown error"}
              {error?.error?.code && ` (Code: ${error.error.code})`}
            </Text>
          </Box>
        )}

        <InlineStack gap="200">
          {canRetry && (
            <Button size="slim" onClick={onRetry}>
              Try Again
            </Button>
          )}

          {onClear && (
            <Button size="slim" variant="secondary" onClick={onClear}>
              Dismiss
            </Button>
          )}

          <Button
            size="slim"
            variant="secondary"
            onClick={handleContactSupport}
          >
            Contact Support
          </Button>
        </InlineStack>

        {!canRetry && retryAttempts >= maxRetryAttempts && (
          <Text variant="bodySm" as="p" tone="critical">
            Maximum retry attempts reached. Please contact support if the
            problem persists.
          </Text>
        )}
      </BlockStack>
    </Banner>
  );
}
