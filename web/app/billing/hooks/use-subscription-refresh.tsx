import { useState, useCallback } from "react";
import {
  SubscriptionRefreshRequest,
  SubscriptionRefreshResponse,
} from "../types";

/**
 * Hook for refreshing subscription data after external changes
 */
export function useSubscriptionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = useCallback(
    async (
      request?: SubscriptionRefreshRequest,
    ): Promise<SubscriptionRefreshResponse | null> => {
      setIsRefreshing(true);
      setError(null);

      try {
        // Get session token from Shopify App Bridge
        const sessionToken = await window.shopify?.idToken?.();

        if (!sessionToken) {
          throw new Error("No session token available");
        }

        const response = await fetch("/api/billing/refresh-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-shopify-session-token": sessionToken,
          },
          body: JSON.stringify(request || {}),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to refresh subscription",
          );
        }

        const data: SubscriptionRefreshResponse = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error refreshing subscription:", err);
        return null;
      } finally {
        setIsRefreshing(false);
      }
    },
    [],
  );

  return {
    refreshSubscription,
    isRefreshing,
    error,
  };
}

/**
 * Example usage component showing how to use the refresh hook
 */
export function SubscriptionRefreshExample() {
  const { refreshSubscription, isRefreshing, error } = useSubscriptionRefresh();

  const handleRefresh = async () => {
    const result = await refreshSubscription();
    if (result?.success) {
      console.log("Subscription refreshed:", result.subscription);
      // You can update your local state or trigger a re-fetch here
    }
  };

  const handleRefreshSpecific = async () => {
    const result = await refreshSubscription({
      shopDomain: "example-shop.myshopify.com",
      subscriptionId: "123",
    });
    if (result?.success) {
      console.log("Specific subscription refreshed:", result.subscription);
    }
  };

  return (
    <div>
      <h3>Subscription Refresh Example</h3>
      <button onClick={handleRefresh} disabled={isRefreshing}>
        {isRefreshing ? "Refreshing..." : "Refresh Current Subscription"}
      </button>
      <button onClick={handleRefreshSpecific} disabled={isRefreshing}>
        {isRefreshing ? "Refreshing..." : "Refresh Specific Subscription"}
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}
