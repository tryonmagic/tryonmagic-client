"use client";

import React from "react";
import {
  Card,
  Text,
  Layout,
  Page,
  Spinner,
  Banner,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { SubscriptionCard } from "./components/subscription-card";
import { UsageMetricsComponent } from "./components/usage-metrics";
import { PlanActions } from "./components/plan-actions";
import { BillingHistory } from "./components/billing-history";
import { AvailablePlans } from "./components/available-plans";
import { BillingErrorBoundary } from "./components/error-boundary";
import {
  BillingPageSkeleton,
  UnsubscribedUserSkeleton,
  SubscriptionCardSkeleton,
  UsageMetricsSkeleton,
  PlanActionsSkeleton,
  BillingHistorySkeleton,
} from "./components/loading-skeletons";
import {
  ComprehensiveErrorHandler,
  useComprehensiveErrorHandling,
  LoadingStateWrapper,
} from "./components/comprehensive-error-handler";
import { useSubscription } from "./hooks/use-subscription";
import { useSubscriptionCreation } from "./hooks/use-subscription-creation";
import { useBillingApiRetry, EnhancedErrorDisplay } from "./hooks/use-retry";
import { SubscriptionStatus } from "./types";

export default function BillingPage() {
  // Use real subscription data
  const {
    subscription,
    usageMetrics,
    availablePlans,
    isLoading,
    error,
    hasActiveSubscription,
    refetch,
  } = useSubscription();

  // Handle subscription creation for unsubscribed users
  const {
    createSubscription,
    isCreating: isCreatingSubscription,
    error: subscriptionCreationError,
    clearError: clearSubscriptionError,
  } = useSubscriptionCreation({
    returnUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}/billing/callback`
        : "/billing/callback",
    onSuccess: (subscriptionUrl) => {
      console.log("Redirecting to subscription URL:", subscriptionUrl);
    },
    onError: (error) => {
      console.error("Subscription creation failed:", error);
    },
  });

  // Set up retry mechanism for subscription data
  const retrySubscriptionFetch = useBillingApiRetry(
    async () => {
      await refetch();
    },
    {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        console.log(`Retrying subscription fetch (attempt ${attempt}):`, error);
      },
      onMaxAttemptsReached: (error) => {
        console.error(
          "Max retry attempts reached for subscription fetch:",
          error,
        );
      },
    },
  );

  // Loading state with enhanced skeletons
  if (isLoading) {
    return (
      <Page
        title="Billing & Subscription"
        subtitle="Manage your subscription plan and billing preferences"
      >
        <Layout>
          <Layout.Section>
            <BillingPageSkeleton />
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <BillingErrorBoundary
      supportEmail="support@example.com"
      onError={(error, errorInfo) => {
        console.error("Billing page error:", error, errorInfo);
      }}
    >
      <Page
        title="Billing & Subscription"
        subtitle="Manage your subscription plan and billing preferences"
      >
        <Layout>
          {/* Enhanced Error Display with Retry Option */}
          {error && (
            <Layout.Section>
              <EnhancedErrorDisplay
                error={error}
                onRetry={() => retrySubscriptionFetch.retry()}
                onClear={() => {
                  // Clear error state if possible
                  console.log("Error cleared by user");
                }}
                supportEmail="support@example.com"
                retryAttempts={retrySubscriptionFetch.state.attemptCount}
                maxRetryAttempts={3}
              />
            </Layout.Section>
          )}

          {/* Subscription Creation Error Banner */}
          {subscriptionCreationError && (
            <Layout.Section>
              <EnhancedErrorDisplay
                error={subscriptionCreationError}
                onClear={clearSubscriptionError}
                supportEmail="support@example.com"
              />
            </Layout.Section>
          )}

          {hasActiveSubscription && subscription ? (
            <>
              {/* Current Subscription Card */}
              <Layout.Section>
                <ComprehensiveErrorHandler
                  fallbackComponent={<SubscriptionCardSkeleton />}
                  supportEmail="support@example.com"
                  componentName="subscription card"
                >
                  <SubscriptionCard
                    subscription={{
                      id: subscription.id,
                      planName: subscription.planName,
                      status: subscription.status,
                      price: subscription.price,
                      currency: subscription.currency,
                      billingCycle: subscription.billingCycle,
                      nextBillingDate: subscription.nextBillingDate
                        .toISOString()
                        .split("T")[0],
                      cancelledAt: subscription.cancelledAt
                        ?.toISOString()
                        .split("T")[0],
                      trialEndsAt: subscription.trialEndsAt
                        ?.toISOString()
                        .split("T")[0],
                      usageMetrics,
                    }}
                  />
                </ComprehensiveErrorHandler>
              </Layout.Section>

              {/* Usage Metrics */}
              {usageMetrics && (
                <Layout.Section>
                  <ComprehensiveErrorHandler
                    fallbackComponent={<UsageMetricsSkeleton />}
                    supportEmail="support@example.com"
                    componentName="usage metrics"
                  >
                    <UsageMetricsComponent
                      usageMetrics={usageMetrics}
                      planName={subscription.planName}
                    />
                  </ComprehensiveErrorHandler>
                </Layout.Section>
              )}

              {/* Plan Management Actions */}
              <Layout.Section>
                <ComprehensiveErrorHandler
                  fallbackComponent={<PlanActionsSkeleton />}
                  supportEmail="support@example.com"
                  componentName="plan actions"
                >
                  <PlanActions
                    subscriptionStatus={subscription.status}
                    onRefreshSubscription={refetch}
                  />
                </ComprehensiveErrorHandler>
              </Layout.Section>

              {/* Billing History Access */}
              <Layout.Section>
                <ComprehensiveErrorHandler
                  fallbackComponent={<BillingHistorySkeleton />}
                  supportEmail="support@example.com"
                  componentName="billing history"
                >
                  <BillingHistory
                    subscriptionStatus={subscription.status}
                    onRefreshSubscription={refetch}
                  />
                </ComprehensiveErrorHandler>
              </Layout.Section>
            </>
          ) : (
            /* No Subscription State - Show Available Plans */
            <Layout.Section>
              <BillingErrorBoundary
                fallback={<UnsubscribedUserSkeleton />}
                supportEmail="support@example.com"
              >
                <AvailablePlans
                  plans={availablePlans || []}
                  onSubscribe={createSubscription}
                  isLoading={isCreatingSubscription}
                  error={
                    subscriptionCreationError?.error?.message ||
                    (error?.error?.message && !availablePlans
                      ? "Failed to load available plans"
                      : null)
                  }
                />
              </BillingErrorBoundary>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </BillingErrorBoundary>
  );
}
