"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Badge,
  BlockStack,
  InlineStack,
  SkeletonPage,
  SkeletonBodyText,
  Banner,
  Spinner,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";
import {
  syncSubscriptionWithBackend,
  SubscriptionStatus,
} from "@/lib/api/subscription-sync";
import { getCurrentShopifySubscription } from "./queries";
import { getSubscriptionPlan, getSubscriptionPlanName } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CircularProgress from "@/components/ui/CircularProgress";
import { getUserDetailsQuery } from "../queries";

export default function BillingPage() {
  const app = useAppBridge();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<{
    content: string;
    error?: boolean;
  } | null>(null);

  const {
    data: user,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [""],
    queryFn: async () => {
      const token = await app.idToken();
      return getUserDetailsQuery(token, ["user-details"]);
    },
  });

  // Sync subscription with backend on page load
  // Fetch current subscription from Shopify via server-side query and sync with backend
  useEffect(() => {
    const syncSubscription = async () => {
      try {
        // Get session token for authentication
        const sessionToken = await app.idToken();

        // Fetch current subscription from Shopify via server-side query
        const shopifySubscription =
          await getCurrentShopifySubscription(sessionToken);
        console.log("Shopify subscription:", shopifySubscription);

        if (!shopifySubscription) {
          console.log("No active Shopify subscription found");
          return;
        }

        // Map Shopify status to internal status enum
        const statusMap: Record<string, SubscriptionStatus> = {
          ACTIVE: SubscriptionStatus.ACTIVE,
          CANCELLED: SubscriptionStatus.CANCELLED,
          PAUSED: SubscriptionStatus.PAUSED,
          EXPIRED: SubscriptionStatus.EXPIRED,
          PENDING: SubscriptionStatus.PENDING,
        };

        const token = await app.idToken();
        const subscription = shopifySubscription.subscription;

        // Sync Shopify subscription with backend
        await syncSubscriptionWithBackend(token, {
          shopDomain: shopifySubscription.shop,
          subscriptionId: subscription.id,
          plan: getSubscriptionPlan(subscription.name),
          status:
            statusMap[subscription.status.toUpperCase()] ||
            SubscriptionStatus.ACTIVE,
          currentPeriodStart: subscription.createdAt,
          currentPeriodEnd: subscription.currentPeriodEnd || undefined,
          metadata: {
            source: "billing_page_server_query",
            shopifySubscriptionId: subscription.id,
          },
        });

        console.log("Shopify subscription synced with backend:", {
          id: subscription.id,
          name: subscription.name,
          status: subscription.status,
        });
        refetch();
      } catch (error) {
        console.error("Error syncing Shopify subscription:", error);
        // Silently fail - don't block UI if sync fails
      }
    };

    // Only sync when not loading (avoid multiple calls)
    if (!isLoading) {
      syncSubscription();
    }
  }, [isLoading, refetch, app]);

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <SkeletonPage title="Billing & Subscription">
        <Layout>
          <Layout.Section>
            <Card>
              <SkeletonBodyText lines={3} />
            </Card>
          </Layout.Section>
        </Layout>
      </SkeletonPage>
    );
  }

  const currentSubscription = user?.subscription;
  const isFreePlan = currentSubscription?.plan === "FREE";
  const isActive = currentSubscription?.status === "ACTIVE";

  return (
    <Page
      title="Billing & Subscription"
      subtitle="Manage your plan and billing details"
      backAction={{ content: "Home", onAction: () => router.push("/") }}
    >
      {toastMessage && (
        <Layout.Section>
          <Banner
            tone={toastMessage.error ? "critical" : "success"}
            onDismiss={() => setToastMessage(null)}
          >
            <p>{toastMessage.content}</p>
          </Banner>
        </Layout.Section>
      )}

      <Layout>
        <Layout.Section>
          <Card>
            {isLoading ? (
              <SkeletonBodyText lines={3} />
            ) : (
              <BlockStack gap="500">
                {isRefetching && (
                  <InlineStack align="center">
                    <Spinner size="small" />
                  </InlineStack>
                )}
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h2">
                      Current Plan
                    </Text>
                    <Badge tone={isActive ? "success" : undefined}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    You are currently subscribed to the{" "}
                    <Text as="span" fontWeight="bold">
                      {currentSubscription &&
                        getSubscriptionPlanName(currentSubscription.plan)}
                    </Text>{" "}
                    plan.
                  </Text>
                </BlockStack>

                <BlockStack gap="400">
                  <InlineStack gap="400" wrap={false}>
                    <div style={{ flex: 1 }}>
                      <Card background="bg-surface-secondary">
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm" tone="subdued">
                            Points Balance
                          </Text>
                          <Text as="p" variant="headingLg">
                            {currentSubscription?.pointsBalance || 0}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Card background="bg-surface-secondary">
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm" tone="subdued">
                            Next Reset
                          </Text>
                          <Text as="p" variant="headingLg">
                            {formatDate(currentSubscription?.nextResetDate)}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Card background="bg-surface-secondary">
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm" tone="subdued">
                            Monthly Points
                          </Text>
                          <Text as="p" variant="headingLg">
                            {currentSubscription?.monthlyPoints || 0}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                  </InlineStack>
                </BlockStack>

                <InlineStack align="end" gap="300">
                  <Button
                    variant="primary"
                    target="_top"
                    url="https://admin.shopify.com/charges/tryonmagic/pricing_plans"
                  >
                    {isFreePlan ? "Upgrade Plan" : "Manage Subscription"}
                  </Button>
                </InlineStack>
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
