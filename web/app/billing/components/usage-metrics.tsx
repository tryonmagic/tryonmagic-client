"use client";

import React from "react";
import {
  Card,
  Text,
  Box,
  BlockStack,
  InlineStack,
  ProgressBar,
  Badge,
  Banner,
  Button,
} from "@shopify/polaris";
import { UsageMetrics } from "../types";
import { useErrorHandler } from "./error-boundary";
import { ComprehensiveErrorHandler } from "./comprehensive-error-handler";
import { UsageMetricsSkeleton } from "./loading-skeletons";

interface UsageMetricsProps {
  usageMetrics?: UsageMetrics;
  planName?: string;
}

export function UsageMetricsComponent({
  usageMetrics,
  planName,
}: UsageMetricsProps) {
  const { handleError } = useErrorHandler();

  // Handle case where usage metrics are not available
  if (!usageMetrics) {
    return (
      <Card>
        <Box padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">
              Usage Metrics
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Usage metrics are not available for your current plan.
            </Text>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  // Validate usage metrics data
  try {
    const { current, limit, unit } = usageMetrics;

    if (typeof current !== "number" || typeof limit !== "number") {
      throw new Error(
        "Invalid usage metrics: current and limit must be numbers",
      );
    }

    if (current < 0 || limit < 0) {
      throw new Error("Invalid usage metrics: values cannot be negative");
    }
  } catch (error) {
    handleError(new Error(`Usage metrics validation failed: ${error}`));
    return (
      <Card>
        <Box padding="400">
          <Banner tone="critical">
            <Text variant="bodyMd" as="p">
              Unable to display usage metrics due to invalid data.
            </Text>
          </Banner>
        </Box>
      </Card>
    );
  }

  const { current, limit, unit } = usageMetrics;

  // Calculate usage percentage
  const usagePercentage =
    limit > 0 ? Math.min((current / limit) * 100, 100) : 0;

  // Determine warning levels and styling
  const getUsageStatus = (percentage: number) => {
    if (percentage >= 100) {
      return {
        tone: "critical" as const,
        badgeTone: "critical" as const,
        message: "Usage limit exceeded",
        showWarning: true,
      };
    } else if (percentage >= 90) {
      return {
        tone: "warning" as const,
        badgeTone: "warning" as const,
        message: "Approaching usage limit",
        showWarning: true,
      };
    } else if (percentage >= 75) {
      return {
        tone: "attention" as const,
        badgeTone: "attention" as const,
        message: "High usage",
        showWarning: false,
      };
    } else {
      return {
        tone: "success" as const,
        badgeTone: "success" as const,
        message: "Normal usage",
        showWarning: false,
      };
    }
  };

  const usageStatus = getUsageStatus(usagePercentage);

  // Format numbers for display with error handling
  const formatUsageNumber = (num: number) => {
    try {
      if (typeof num !== "number" || isNaN(num)) {
        throw new Error(`Invalid number: ${num}`);
      }
      return new Intl.NumberFormat("en-US").format(num);
    } catch (error) {
      console.warn(`Failed to format number ${num}:`, error);
      return num.toString();
    }
  };

  // Get progress bar tone based on usage level
  const getProgressBarTone = (percentage: number) => {
    if (percentage >= 100) return "critical";
    if (percentage >= 90) return "warning";
    return undefined; // Use default tone for normal usage
  };

  return (
    <ComprehensiveErrorHandler
      componentName="usage metrics"
      supportEmail="support@example.com"
      fallbackComponent={<UsageMetricsSkeleton />}
    >
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" wrap={false}>
              <Text variant="headingMd" as="h2">
                Usage Metrics
              </Text>
              <Badge tone={usageStatus.badgeTone}>{usageStatus.message}</Badge>
            </InlineStack>

            <BlockStack gap="300">
              {/* Usage Progress Bar */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" wrap={false}>
                    <Text variant="bodyMd" as="p">
                      Current Usage
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      {formatUsageNumber(current)} / {formatUsageNumber(limit)}{" "}
                      {unit}
                    </Text>
                  </InlineStack>

                  <ProgressBar progress={usagePercentage} size="medium" />

                  <InlineStack align="space-between" wrap={false}>
                    <Text variant="bodySm" as="p" tone="subdued">
                      0 {unit}
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {Math.round(usagePercentage)}% used
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {formatUsageNumber(limit)} {unit}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>

              {/* Usage Warning Messages */}
              {usageStatus.showWarning && (
                <Box
                  padding="300"
                  background={
                    usagePercentage >= 100
                      ? "bg-fill-critical-secondary"
                      : "bg-fill-warning-secondary"
                  }
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" tone="subdued">
                      {usagePercentage >= 100
                        ? "You have exceeded your usage limit"
                        : "You are approaching your usage limit"}
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {usagePercentage >= 100
                        ? "Additional usage may result in overage charges. Consider upgrading your plan."
                        : "Consider upgrading your plan to avoid potential service interruptions."}
                    </Text>
                  </BlockStack>
                </Box>
              )}

              {/* Additional Usage Information */}
              <Box paddingBlockStart="200">
                <BlockStack gap="100">
                  <Text variant="bodySm" as="p" tone="subdued">
                    Remaining: {formatUsageNumber(Math.max(0, limit - current))}{" "}
                    {unit}
                  </Text>
                  {planName && (
                    <Text variant="bodySm" as="p" tone="subdued">
                      Plan: {planName}
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </BlockStack>
          </BlockStack>
        </Box>
      </Card>
    </ComprehensiveErrorHandler>
  );
}
