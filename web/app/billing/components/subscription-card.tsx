"use client";

import React from "react";
import {
  Card,
  Text,
  Badge,
  Box,
  InlineStack,
  BlockStack,
  Banner,
  Button,
} from "@shopify/polaris";
import { SubscriptionData, SubscriptionStatus } from "../types";
import { useErrorHandler } from "./error-boundary";

interface SubscriptionCardProps {
  subscription: SubscriptionData;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { handleError } = useErrorHandler();

  const {
    planName,
    status,
    price,
    currency,
    billingCycle,
    nextBillingDate,
    cancelledAt,
    trialEndsAt,
  } = subscription;

  // Format price display with error handling
  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(price);
    } catch (error) {
      handleError(new Error(`Failed to format price: ${error}`));
      return `${currency} ${price.toFixed(2)}`;
    }
  };

  // Format date display with error handling
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      handleError(new Error(`Failed to format date: ${error}`));
      return dateString;
    }
  };

  // Get badge tone based on subscription status
  const getBadgeTone = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return "success";
      case SubscriptionStatus.TRIAL:
        return "info";
      case SubscriptionStatus.CANCELLED:
        return "warning";
      case SubscriptionStatus.EXPIRED:
        return "critical";
      case SubscriptionStatus.PENDING:
        return "attention";
      default:
        return "info";
    }
  };

  // Get status display text
  const getStatusText = (status: SubscriptionStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Determine what date to show and its label
  const getDateInfo = () => {
    if (status === SubscriptionStatus.TRIAL && trialEndsAt) {
      return {
        label: "Trial ends",
        date: trialEndsAt,
        tone: "subdued" as const,
      };
    }

    if (status === SubscriptionStatus.CANCELLED && cancelledAt) {
      return {
        label: "Access ends",
        date: nextBillingDate, // Access continues until next billing date
        tone: "subdued" as const,
      };
    }

    if (status === SubscriptionStatus.ACTIVE) {
      return {
        label: "Next billing date",
        date: nextBillingDate,
        tone: "subdued" as const,
      };
    }

    return null;
  };

  const dateInfo = getDateInfo();

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            Current Subscription
          </Text>

          <InlineStack align="space-between" wrap={false}>
            <BlockStack gap="200">
              <Text variant="headingMd" as="h3">
                {planName}
              </Text>

              <InlineStack gap="200" align="start">
                <Badge tone={getBadgeTone(status)}>
                  {getStatusText(status)}
                </Badge>

                {status !== SubscriptionStatus.EXPIRED && (
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {formatPrice(price, currency)}/{billingCycle}
                  </Text>
                )}
              </InlineStack>
            </BlockStack>

            {dateInfo && (
              <BlockStack gap="100" align="end">
                <Text variant="bodyMd" as="p" tone="subdued">
                  {dateInfo.label}
                </Text>
                <Text variant="bodyMd" as="p" tone={dateInfo.tone}>
                  {formatDate(dateInfo.date)}
                </Text>
              </BlockStack>
            )}
          </InlineStack>

          {/* Additional status-specific information */}
          {status === SubscriptionStatus.CANCELLED && cancelledAt && (
            <Box paddingBlockStart="200">
              <Text variant="bodyMd" as="p" tone="subdued">
                Cancelled on {formatDate(cancelledAt)}. You'll continue to have
                access until {formatDate(nextBillingDate)}.
              </Text>
            </Box>
          )}

          {status === SubscriptionStatus.TRIAL && trialEndsAt && (
            <Box paddingBlockStart="200">
              <Text variant="bodyMd" as="p" tone="subdued">
                Your trial period ends on {formatDate(trialEndsAt)}. Subscribe
                to continue using premium features.
              </Text>
            </Box>
          )}

          {status === SubscriptionStatus.EXPIRED && (
            <Box paddingBlockStart="200">
              <Text variant="bodyMd" as="p" tone="critical">
                Your subscription has expired. Renew to regain access to premium
                features.
              </Text>
            </Box>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
