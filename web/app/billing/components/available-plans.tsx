"use client";

import React, { useState } from "react";
import {
  Card,
  Text,
  Button,
  Badge,
  List,
  Spinner,
  Banner,
  BlockStack,
  Box,
} from "@shopify/polaris";
import { Plan, BillingCycle } from "../types";
import { ComprehensiveErrorHandler } from "./comprehensive-error-handler";
import { AvailablePlansSkeleton } from "./loading-skeletons";
import { useErrorHandler } from "./error-boundary";

interface AvailablePlansProps {
  plans: Plan[];
  onSubscribe: (planId: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function AvailablePlans({
  plans,
  onSubscribe,
  isLoading = false,
  error = null,
}: AvailablePlansProps) {
  const { handleError } = useErrorHandler();
  const [subscribingToPlan, setSubscribingToPlan] = useState<string | null>(
    null,
  );
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribingToPlan(planId);
      setSubscriptionError(null);
      await onSubscribe(planId);
    } catch (error) {
      console.error("Failed to subscribe to plan:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create subscription. Please try again.";
      setSubscriptionError(errorMessage);
      handleError(new Error(`Subscription creation failed: ${errorMessage}`));
    } finally {
      setSubscribingToPlan(null);
    }
  };

  const formatPrice = (
    price: number,
    currency: string,
    cycle: BillingCycle,
  ) => {
    try {
      const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(price);

      const cycleText = cycle === BillingCycle.YEARLY ? "year" : "month";
      return `${formattedPrice}/${cycleText}`;
    } catch (error) {
      console.warn("Failed to format price:", error);
      return `${currency} ${price}/${cycle}`;
    }
  };

  // Use loading skeleton for better UX
  if (isLoading) {
    return <AvailablePlansSkeleton />;
  }

  return (
    <ComprehensiveErrorHandler
      error={error ? new Error(error) : null}
      componentName="available plans"
      supportEmail="support@example.com"
    >
      <div>
        {/* Individual subscription error */}
        {subscriptionError && (
          <Box paddingBlockEnd="400">
            <Banner
              tone="critical"
              onDismiss={() => setSubscriptionError(null)}
            >
              <Text variant="bodyMd" as="p">
                {subscriptionError}
              </Text>
            </Banner>
          </Box>
        )}

        <Card>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <Text variant="headingLg" as="h2">
                Choose Your Plan
              </Text>
              <div style={{ marginTop: "0.5rem" }}>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Select a subscription plan to unlock premium features and get
                  the most out of ProdigyAI.
                </Text>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <BlockStack gap="400">
                    {/* Plan Header */}
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <Text variant="headingMd" as="h3">
                          {plan.name}
                        </Text>
                        {plan.isPopular && (
                          <Badge tone="success">Most Popular</Badge>
                        )}
                      </div>
                      <Text variant="headingXl" as="p">
                        {formatPrice(
                          plan.price,
                          plan.currency,
                          plan.billingCycle,
                        )}
                      </Text>
                    </div>

                    {/* Plan Features */}
                    <div>
                      <Text variant="bodyMd" as="p" fontWeight="medium">
                        Features included:
                      </Text>
                      <div style={{ marginTop: "0.5rem" }}>
                        <List type="bullet">
                          {plan.features.map((feature, index) => (
                            <List.Item key={index}>{feature}</List.Item>
                          ))}
                        </List>
                      </div>
                    </div>

                    {/* Subscribe Button */}
                    <div style={{ marginTop: "1rem" }}>
                      <Button
                        variant={plan.isPopular ? "primary" : "secondary"}
                        size="large"
                        fullWidth
                        loading={subscribingToPlan === plan.id}
                        disabled={subscribingToPlan !== null}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {subscribingToPlan === plan.id
                          ? "Setting up subscription..."
                          : "Subscribe Now"}
                      </Button>
                    </div>
                  </BlockStack>
                </Card>
              ))}
            </div>

            {/* Additional Information */}
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                backgroundColor: "var(--p-color-bg-surface-secondary)",
                borderRadius: "var(--p-border-radius-200)",
                textAlign: "center",
              }}
            >
              <Text variant="bodyMd" as="p" tone="subdued">
                All plans include a 14-day free trial. Cancel anytime. No setup
                fees.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </ComprehensiveErrorHandler>
  );
}
