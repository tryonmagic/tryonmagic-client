"use client";

import React, { useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Spinner,
  Banner,
  Box,
} from "@shopify/polaris";
import { useSubscription, SHOPIFY_BILLING_URL } from "./subscription-context";

/**
 * SubscriptionGate component
 *
 * This component acts as a gatekeeper that ensures users have an active
 * Shopify subscription before they can access the app.
 *
 * - Shows a loading spinner while checking subscription status
 * - Shows a subscription required page if no active subscription
 * - Renders children if subscription is active
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { subscriptionState } = useSubscription();

  // No subscription - show subscription required page
  if (subscriptionState === "none") {
    return (
      <div style={{ padding: "2rem" }}>
        <Page>
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="500">
                  <BlockStack gap="200">
                    <Text variant="headingXl" as="h1">
                      Subscription Required
                    </Text>
                    <Text variant="bodyLg" as="p" tone="subdued">
                      To use TryOnMagic, you need to subscribe to one of our
                      plans. Choose a plan that fits your needs and start
                      transforming your product images with AI.
                    </Text>
                  </BlockStack>

                  <Box paddingBlockStart="400">
                    <InlineStack align="center">
                      <Button
                        variant="primary"
                        size="large"
                        url={SHOPIFY_BILLING_URL}
                        target="_top"
                      >
                        Choose a Plan
                      </Button>
                    </InlineStack>
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    );
  }

  // Error state
  if (subscriptionState === "error") {
    return (
      <div style={{ padding: "2rem" }}>
        <Page>
          <Layout>
            <Layout.Section>
              <Banner tone="critical">
                <p>
                  We encountered an error checking your subscription status.
                  Please try refreshing the page or contact support if the issue
                  persists.
                </p>
              </Banner>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Unable to verify subscription
                  </Text>
                  <Text as="p" tone="subdued">
                    If you have an active subscription, try refreshing the page.
                    Otherwise, you can subscribe to a plan below.
                  </Text>
                  <InlineStack gap="300">
                    <Button onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                    <Button
                      variant="primary"
                      url={SHOPIFY_BILLING_URL}
                      target="_top"
                    >
                      View Plans
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </div>
    );
  }

  // Active subscription - render children
  return <>{children}</>;
}
