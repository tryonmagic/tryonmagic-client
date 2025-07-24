/**
 * Example usage of the useSubscription hook
 * This file demonstrates how to use the hook in a React component
 */

import React from "react";
import {
  useSubscription,
  usePrefetchSubscription,
  useSubscriptionMutations,
} from "./use-subscription";
import { BillingCycle } from "../types";

// Example component showing basic usage
export function SubscriptionExample() {
  const {
    subscription,
    usageMetrics,
    availablePlans,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    hasActiveSubscription,
    isSubscriptionActive,
    isSubscriptionCancelled,
  } = useSubscription({
    enablePolling: true,
    pollingInterval: 30000, // 30 seconds
  });

  if (isLoading) {
    return <div>Loading subscription data...</div>;
  }

  if (isError) {
    return (
      <div>
        <h3>Error loading subscription</h3>
        <p>{error?.error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div>
        <h3>No Active Subscription</h3>
        <p>Choose a plan to get started:</p>
        {availablePlans?.map((plan) => (
          <div key={plan.id}>
            <h4>{plan.name}</h4>
            <p>
              ${plan.price}/{plan.billingCycle}
            </p>
            <ul>
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3>Current Subscription</h3>
      <div>
        <p>
          <strong>Plan:</strong> {subscription?.planName}
        </p>
        <p>
          <strong>Status:</strong> {subscription?.status}
        </p>
        <p>
          <strong>Price:</strong> ${subscription?.price}{" "}
          {subscription?.currency}
        </p>
        <p>
          <strong>Billing Cycle:</strong> {subscription?.billingCycle}
        </p>
        <p>
          <strong>Next Billing:</strong>{" "}
          {subscription?.nextBillingDate.toLocaleDateString()}
        </p>

        {isSubscriptionCancelled && subscription?.cancelledAt && (
          <p>
            <strong>Cancelled:</strong>{" "}
            {subscription.cancelledAt.toLocaleDateString()}
          </p>
        )}
      </div>

      {usageMetrics && (
        <div>
          <h4>Usage Metrics</h4>
          <p>
            {usageMetrics.current} / {usageMetrics.limit} {usageMetrics.unit}
          </p>
          <div
            style={{
              width: "100%",
              height: "20px",
              backgroundColor: "#f0f0f0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(usageMetrics.current / usageMetrics.limit) * 100}%`,
                height: "100%",
                backgroundColor: isSubscriptionActive ? "#4CAF50" : "#FF9800",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      <div>
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div>
        <p>
          <strong>Status Indicators:</strong>
        </p>
        <ul>
          <li>
            Has Active Subscription: {hasActiveSubscription ? "✅" : "❌"}
          </li>
          <li>Is Active: {isSubscriptionActive ? "✅" : "❌"}</li>
          <li>Is Cancelled: {isSubscriptionCancelled ? "✅" : "❌"}</li>
        </ul>
      </div>
    </div>
  );
}

// Example component showing prefetch usage
export function SubscriptionPrefetchExample() {
  const prefetchSubscription = usePrefetchSubscription();

  const handleMouseEnter = () => {
    // Prefetch subscription data when user hovers over billing link
    prefetchSubscription();
  };

  return (
    <a
      href="/billing"
      onMouseEnter={handleMouseEnter}
      style={{ textDecoration: "underline", color: "blue" }}
    >
      Go to Billing (hover to prefetch)
    </a>
  );
}

// Example component showing mutation usage
export function SubscriptionMutationExample() {
  const { refreshAfterExternalChange, updateSubscriptionCache } =
    useSubscriptionMutations();

  const handleReturnFromShopify = async () => {
    // Call this when user returns from Shopify billing pages
    await refreshAfterExternalChange();
    console.log("Subscription data refreshed after external change");
  };

  const handleManualUpdate = () => {
    // Example of manually updating the cache
    const newData = {
      subscription: null,
      availablePlans: [
        {
          id: "basic",
          name: "Basic Plan",
          price: 9.99,
          currency: "USD",
          billingCycle: BillingCycle.MONTHLY,
          features: ["Basic features"],
        },
      ],
    };
    updateSubscriptionCache(newData);
  };

  return (
    <div>
      <button onClick={handleReturnFromShopify}>
        Refresh After Shopify Return
      </button>
      <button onClick={handleManualUpdate}>Manual Cache Update</button>
    </div>
  );
}

// Example showing different hook configurations
export function SubscriptionConfigExample() {
  // High-frequency polling for critical updates
  const criticalSubscription = useSubscription({
    enablePolling: true,
    pollingInterval: 5000, // 5 seconds
    retryAttempts: 5,
  });

  // Low-frequency polling for background updates
  const backgroundSubscription = useSubscription({
    enablePolling: true,
    pollingInterval: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // No polling for static display
  const staticSubscription = useSubscription({
    enablePolling: false,
    retry: false,
  });

  return (
    <div>
      <h3>Different Hook Configurations</h3>
      <div>
        <h4>Critical (5s polling):</h4>
        <p>
          Status: {criticalSubscription.subscription?.status || "Loading..."}
        </p>
      </div>
      <div>
        <h4>Background (1m polling):</h4>
        <p>
          Status: {backgroundSubscription.subscription?.status || "Loading..."}
        </p>
      </div>
      <div>
        <h4>Static (no polling):</h4>
        <p>Status: {staticSubscription.subscription?.status || "Loading..."}</p>
      </div>
    </div>
  );
}
