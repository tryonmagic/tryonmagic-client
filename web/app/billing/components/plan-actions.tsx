"use client";

import React, { useState, useCallback } from "react";
import {
  Card,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Modal,
  Box,
  Banner,
} from "@shopify/polaris";
import {
  SubscriptionStatus,
  ShopifyUrlsResponse,
  BillingApiError,
} from "../types";
import { useErrorHandler } from "./error-boundary";
import { useBillingApiRetry } from "../hooks/use-retry";

interface PlanActionsProps {
  subscriptionStatus: SubscriptionStatus;
  onRefreshSubscription?: () => Promise<void>;
}

interface ShopifyUrlsState {
  changePlanUrl?: string;
  cancelPlanUrl?: string;
  isLoading: boolean;
  error: string | null;
}

export function PlanActions({
  subscriptionStatus,
  onRefreshSubscription,
}: PlanActionsProps) {
  const { handleError } = useErrorHandler();

  // State for managing Shopify URLs and loading states
  const [urlsState, setUrlsState] = useState<ShopifyUrlsState>({
    isLoading: false,
    error: null,
  });

  // State for cancel confirmation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // State for change plan loading
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Retry mechanism for fetching Shopify URLs
  const retryFetchUrls = useBillingApiRetry(
    async () => {
      return await fetchShopifyUrls();
    },
    {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        console.log(`Retrying URL fetch (attempt ${attempt}):`, error);
      },
      onMaxAttemptsReached: (error) => {
        console.error("Max retry attempts reached for URL fetch:", error);
        setUrlsState((prev) => ({
          ...prev,
          error:
            "Unable to generate billing URLs after multiple attempts. Please try again later.",
        }));
      },
    },
  );

  /**
   * Fetch Shopify URLs for plan management
   */
  const fetchShopifyUrls =
    useCallback(async (): Promise<ShopifyUrlsResponse | null> => {
      try {
        setUrlsState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Get session token from Shopify App Bridge or localStorage
        const sessionToken =
          (window as any)?.shopify?.sessionToken ||
          localStorage.getItem("shopify-session-token") ||
          sessionStorage.getItem("shopify-session-token");

        if (!sessionToken) {
          throw new Error(
            "No session token available. Please re-authenticate.",
          );
        }

        const response = await fetch("/api/billing/shopify-urls", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-shopify-session-token": sessionToken,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          if (errorData && "error" in errorData) {
            const billingError = errorData as BillingApiError;
            throw new Error(billingError.error.message);
          }

          throw new Error(`Request failed with status ${response.status}`);
        }

        const urls = (await response.json()) as ShopifyUrlsResponse;

        setUrlsState((prev) => ({
          ...prev,
          changePlanUrl: urls.changePlanUrl,
          cancelPlanUrl: urls.cancelPlanUrl,
          isLoading: false,
        }));

        return urls;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch Shopify URLs";
        setUrlsState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        console.error("Error fetching Shopify URLs:", error);
        return null;
      }
    }, []);

  /**
   * Handle plan change button click
   */
  const handleChangePlan = useCallback(async () => {
    try {
      setIsChangingPlan(true);

      // Fetch URLs if not already available
      let changePlanUrl = urlsState.changePlanUrl;
      if (!changePlanUrl) {
        const urls = await fetchShopifyUrls();
        changePlanUrl = urls?.changePlanUrl;
      }

      if (!changePlanUrl) {
        throw new Error(
          "Unable to generate plan change URL. Please try again.",
        );
      }

      // Store callback for when user returns from Shopify
      if (onRefreshSubscription) {
        sessionStorage.setItem("billing-action-pending", "change-plan");
      }

      // Redirect to Shopify plan management
      window.location.href = changePlanUrl;
    } catch (error) {
      console.error("Error changing plan:", error);
      setIsChangingPlan(false);

      // Show error to user
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change plan";
      setUrlsState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [urlsState.changePlanUrl, fetchShopifyUrls, onRefreshSubscription]);

  /**
   * Handle cancel plan confirmation
   */
  const handleCancelPlan = useCallback(async () => {
    try {
      setIsCancelling(true);

      // Fetch URLs if not already available
      let cancelPlanUrl = urlsState.cancelPlanUrl;
      if (!cancelPlanUrl) {
        const urls = await fetchShopifyUrls();
        cancelPlanUrl = urls?.cancelPlanUrl;
      }

      if (!cancelPlanUrl) {
        throw new Error(
          "Unable to generate cancellation URL. Please try again.",
        );
      }

      // Store callback for when user returns from Shopify
      if (onRefreshSubscription) {
        sessionStorage.setItem("billing-action-pending", "cancel-plan");
      }

      // Close modal and redirect to Shopify cancellation
      setShowCancelModal(false);
      window.location.href = cancelPlanUrl;
    } catch (error) {
      console.error("Error cancelling plan:", error);
      setIsCancelling(false);

      // Show error to user
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel plan";
      setUrlsState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [urlsState.cancelPlanUrl, fetchShopifyUrls, onRefreshSubscription]);

  /**
   * Handle opening cancel confirmation modal
   */
  const handleOpenCancelModal = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  /**
   * Handle closing cancel confirmation modal
   */
  const handleCloseCancelModal = useCallback(() => {
    setShowCancelModal(false);
    setIsCancelling(false);
  }, []);

  // Determine which actions should be available based on subscription status
  const canChangePlan = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIAL,
  ].includes(subscriptionStatus);

  const canCancelPlan = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIAL,
  ].includes(subscriptionStatus);

  // Don't render anything if no actions are available
  if (!canChangePlan && !canCancelPlan) {
    return null;
  }

  return (
    <>
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Plan Actions
            </Text>

            {urlsState.error && (
              <Box paddingBlockEnd="200">
                <Banner tone="critical">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p">
                      {urlsState.error}
                    </Text>
                    {retryFetchUrls.state.canRetry && (
                      <InlineStack gap="200">
                        <Button
                          size="slim"
                          onClick={() => retryFetchUrls.retry()}
                          loading={retryFetchUrls.state.isRetrying}
                        >
                          {retryFetchUrls.state.isRetrying
                            ? "Retrying..."
                            : "Try Again"}
                        </Button>
                        {retryFetchUrls.state.attemptCount > 0 && (
                          <Text variant="bodySm" as="span" tone="subdued">
                            Attempt {retryFetchUrls.state.attemptCount} of 3
                          </Text>
                        )}
                      </InlineStack>
                    )}
                  </BlockStack>
                </Banner>
              </Box>
            )}

            <InlineStack gap="300" wrap={false}>
              {canChangePlan && (
                <Button
                  variant="primary"
                  loading={isChangingPlan || urlsState.isLoading}
                  disabled={isCancelling}
                  onClick={handleChangePlan}
                >
                  Change Plan
                </Button>
              )}

              {canCancelPlan && (
                <Button
                  variant="secondary"
                  tone="critical"
                  loading={isCancelling || urlsState.isLoading}
                  disabled={isChangingPlan}
                  onClick={handleOpenCancelModal}
                >
                  Cancel Plan
                </Button>
              )}
            </InlineStack>

            {subscriptionStatus === SubscriptionStatus.TRIAL && (
              <Box paddingBlockStart="200">
                <Text variant="bodyMd" as="p" tone="subdued">
                  You can change or cancel your plan at any time during your
                  trial period.
                </Text>
              </Box>
            )}

            {subscriptionStatus === SubscriptionStatus.ACTIVE && (
              <Box paddingBlockStart="200">
                <Text variant="bodyMd" as="p" tone="subdued">
                  Plan changes take effect immediately. Cancellations take
                  effect at the end of your current billing period.
                </Text>
              </Box>
            )}
          </BlockStack>
        </Box>
      </Card>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={showCancelModal}
        onClose={handleCloseCancelModal}
        title="Cancel Subscription"
        primaryAction={{
          content: "Yes, Cancel Plan",
          onAction: handleCancelPlan,
          loading: isCancelling,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Keep Plan",
            onAction: handleCloseCancelModal,
            disabled: isCancelling,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Are you sure you want to cancel your subscription? This action
              will:
            </Text>

            <BlockStack gap="200">
              <Text variant="bodyMd" as="p">
                • Stop future billing charges
              </Text>
              <Text variant="bodyMd" as="p">
                • Maintain access until the end of your current billing period
              </Text>
              <Text variant="bodyMd" as="p">
                • Remove access to premium features after the billing period
                ends
              </Text>
            </BlockStack>

            <Text variant="bodyMd" as="p" tone="subdued">
              You can resubscribe at any time to regain access to premium
              features.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}
