"use client";

import React, { useState, useCallback } from "react";
import {
  Card,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Box,
  Link,
  Banner,
} from "@shopify/polaris";
import {
  SubscriptionStatus,
  ShopifyUrlsResponse,
  BillingApiError,
} from "../types";
import { useErrorHandler } from "./error-boundary";
import { useBillingApiRetry } from "../hooks/use-retry";

interface BillingHistoryProps {
  subscriptionStatus?: SubscriptionStatus;
  onRefreshSubscription?: () => Promise<void>;
}

interface ShopifyUrlsState {
  billingHistoryUrl?: string;
  paymentMethodsUrl?: string;
  isLoading: boolean;
  error: string | null;
}

interface RecentBillingInfo {
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  currency?: string;
  nextPaymentDate?: string;
}

export function BillingHistory({
  subscriptionStatus,
  onRefreshSubscription,
}: BillingHistoryProps) {
  const { handleError } = useErrorHandler();

  // State for managing Shopify URLs and loading states
  const [urlsState, setUrlsState] = useState<ShopifyUrlsState>({
    isLoading: false,
    error: null,
  });

  // State for individual button loading
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Retry mechanism for fetching Shopify URLs
  const retryFetchUrls = useBillingApiRetry(
    async () => {
      return await fetchShopifyUrls();
    },
    {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        console.log(`Retrying billing URL fetch (attempt ${attempt}):`, error);
      },
      onMaxAttemptsReached: (error) => {
        console.error(
          "Max retry attempts reached for billing URL fetch:",
          error,
        );
        setUrlsState((prev) => ({
          ...prev,
          error:
            "Unable to generate billing URLs after multiple attempts. Please try again later.",
        }));
      },
    },
  );

  /**
   * Fetch Shopify URLs for billing management
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
          billingHistoryUrl: urls.billingHistoryUrl,
          paymentMethodsUrl: urls.paymentMethodsUrl,
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
   * Handle billing history button click
   */
  const handleViewBillingHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);

      // Fetch URLs if not already available
      let billingHistoryUrl = urlsState.billingHistoryUrl;
      if (!billingHistoryUrl) {
        const urls = await fetchShopifyUrls();
        billingHistoryUrl = urls?.billingHistoryUrl;
      }

      if (!billingHistoryUrl) {
        throw new Error(
          "Unable to generate billing history URL. Please try again.",
        );
      }

      // Store callback for when user returns from Shopify
      if (onRefreshSubscription) {
        sessionStorage.setItem("billing-action-pending", "view-history");
      }

      // Redirect to Shopify billing history
      window.location.href = billingHistoryUrl;
    } catch (error) {
      console.error("Error accessing billing history:", error);
      setIsLoadingHistory(false);

      // Show error to user
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to access billing history";
      setUrlsState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [urlsState.billingHistoryUrl, fetchShopifyUrls, onRefreshSubscription]);

  /**
   * Handle payment methods button click
   */
  const handleManagePaymentMethods = useCallback(async () => {
    try {
      setIsLoadingPayment(true);

      // Fetch URLs if not already available
      let paymentMethodsUrl = urlsState.paymentMethodsUrl;
      if (!paymentMethodsUrl) {
        const urls = await fetchShopifyUrls();
        paymentMethodsUrl = urls?.paymentMethodsUrl;
      }

      if (!paymentMethodsUrl) {
        throw new Error(
          "Unable to generate payment methods URL. Please try again.",
        );
      }

      // Store callback for when user returns from Shopify
      if (onRefreshSubscription) {
        sessionStorage.setItem("billing-action-pending", "manage-payment");
      }

      // Redirect to Shopify payment methods
      window.location.href = paymentMethodsUrl;
    } catch (error) {
      console.error("Error accessing payment methods:", error);
      setIsLoadingPayment(false);

      // Show error to user
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to access payment methods";
      setUrlsState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [urlsState.paymentMethodsUrl, fetchShopifyUrls, onRefreshSubscription]);

  // Format date display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format price display
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  // Mock recent billing info - in a real implementation, this would come from props or API
  const recentBillingInfo: RecentBillingInfo = {
    // These would be passed as props or fetched from an API in a real implementation
    // For now, we'll show placeholder content when subscription is active
  };

  // Determine if billing history should be shown
  const showBillingHistory =
    subscriptionStatus &&
    [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
    ].includes(subscriptionStatus);

  // Don't render anything if user has no subscription history
  if (!showBillingHistory) {
    return null;
  }

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            Billing & Payment
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

          {/* Quick access to recent billing information */}
          {subscriptionStatus === SubscriptionStatus.ACTIVE &&
            recentBillingInfo.lastPaymentDate && (
              <Box paddingBlockEnd="200">
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Recent billing activity:
                  </Text>
                  <InlineStack gap="400" wrap={false}>
                    <Text variant="bodyMd" as="p">
                      Last payment:{" "}
                      {formatDate(recentBillingInfo.lastPaymentDate)}
                    </Text>
                    {recentBillingInfo.lastPaymentAmount &&
                      recentBillingInfo.currency && (
                        <Text variant="bodyMd" as="p">
                          Amount:{" "}
                          {formatPrice(
                            recentBillingInfo.lastPaymentAmount,
                            recentBillingInfo.currency,
                          )}
                        </Text>
                      )}
                  </InlineStack>
                </BlockStack>
              </Box>
            )}

          {/* Action buttons */}
          <InlineStack gap="300" wrap={false}>
            <Button
              variant="secondary"
              loading={isLoadingHistory || urlsState.isLoading}
              disabled={isLoadingPayment}
              onClick={handleViewBillingHistory}
            >
              View Billing History
            </Button>

            <Button
              variant="secondary"
              loading={isLoadingPayment || urlsState.isLoading}
              disabled={isLoadingHistory}
              onClick={handleManagePaymentMethods}
            >
              Manage Payment Methods
            </Button>
          </InlineStack>

          {/* Helpful information based on subscription status */}
          <Box paddingBlockStart="200">
            {subscriptionStatus === SubscriptionStatus.ACTIVE && (
              <Text variant="bodyMd" as="p" tone="subdued">
                Access your complete billing history and manage payment methods
                through Shopify's secure billing portal.
              </Text>
            )}

            {subscriptionStatus === SubscriptionStatus.CANCELLED && (
              <Text variant="bodyMd" as="p" tone="subdued">
                View your billing history and manage payment methods. You can
                reactivate your subscription at any time.
              </Text>
            )}

            {subscriptionStatus === SubscriptionStatus.EXPIRED && (
              <Text variant="bodyMd" as="p" tone="subdued">
                Access your past billing history and update payment methods to
                reactivate your subscription.
              </Text>
            )}
          </Box>

          {/* Additional help text */}
          <Box paddingBlockStart="100">
            <Text variant="bodyMd" as="p" tone="subdued">
              All billing is securely managed by Shopify. You'll be redirected
              to Shopify's billing portal to view history and manage payment
              methods.
            </Text>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}
