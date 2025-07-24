"use client";

import React from "react";
import {
  Card,
  Box,
  BlockStack,
  InlineStack,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonThumbnail,
} from "@shopify/polaris";

/**
 * Loading skeleton for the subscription card component
 */
export function SubscriptionCardSkeleton() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <SkeletonDisplayText size="medium" />

          <InlineStack align="space-between" wrap={false}>
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <InlineStack gap="200" align="start">
                <div
                  style={{
                    width: "60px",
                    height: "20px",
                    backgroundColor: "var(--p-color-bg-fill-secondary)",
                    borderRadius: "var(--p-border-radius-100)",
                  }}
                />
                <SkeletonBodyText lines={1} />
              </InlineStack>
            </BlockStack>

            <BlockStack gap="100" align="end">
              <SkeletonBodyText lines={1} />
              <SkeletonBodyText lines={1} />
            </BlockStack>
          </InlineStack>

          <Box paddingBlockStart="200">
            <SkeletonBodyText lines={2} />
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Loading skeleton for the usage metrics component
 */
export function UsageMetricsSkeleton() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" wrap={false}>
            <SkeletonDisplayText size="medium" />
            <div
              style={{
                width: "80px",
                height: "20px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-100)",
              }}
            />
          </InlineStack>

          <BlockStack gap="300">
            <Box>
              <BlockStack gap="200">
                <InlineStack align="space-between" wrap={false}>
                  <SkeletonBodyText lines={1} />
                  <SkeletonBodyText lines={1} />
                </InlineStack>

                {/* Progress bar skeleton */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "var(--p-color-bg-fill-secondary)",
                    borderRadius: "var(--p-border-radius-100)",
                  }}
                />

                <InlineStack align="space-between" wrap={false}>
                  <SkeletonBodyText lines={1} />
                  <SkeletonBodyText lines={1} />
                  <SkeletonBodyText lines={1} />
                </InlineStack>
              </BlockStack>
            </Box>

            <Box paddingBlockStart="200">
              <BlockStack gap="100">
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
              </BlockStack>
            </Box>
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Loading skeleton for the plan actions component
 */
export function PlanActionsSkeleton() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <SkeletonDisplayText size="medium" />

          <InlineStack gap="300" wrap={false}>
            <div
              style={{
                width: "120px",
                height: "36px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-200)",
              }}
            />
            <div
              style={{
                width: "100px",
                height: "36px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-200)",
              }}
            />
          </InlineStack>

          <Box paddingBlockStart="200">
            <SkeletonBodyText lines={2} />
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Loading skeleton for the billing history component
 */
export function BillingHistorySkeleton() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <SkeletonDisplayText size="medium" />

          <Box paddingBlockEnd="200">
            <BlockStack gap="200">
              <SkeletonBodyText lines={1} />
              <InlineStack gap="400" wrap={false}>
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
              </InlineStack>
            </BlockStack>
          </Box>

          <InlineStack gap="300" wrap={false}>
            <div
              style={{
                width: "140px",
                height: "36px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-200)",
              }}
            />
            <div
              style={{
                width: "160px",
                height: "36px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-200)",
              }}
            />
          </InlineStack>

          <Box paddingBlockStart="200">
            <SkeletonBodyText lines={2} />
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Loading skeleton for available plans component
 */
export function AvailablePlansSkeleton() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <SkeletonDisplayText size="large" />
          <SkeletonBodyText lines={2} />

          <BlockStack gap="300">
            {[1, 2, 3].map((index) => (
              <Card key={index} background="bg-fill-secondary">
                <Box padding="300">
                  <BlockStack gap="300">
                    <InlineStack align="space-between" wrap={false}>
                      <SkeletonDisplayText size="small" />
                      {index === 2 && (
                        <div
                          style={{
                            width: "60px",
                            height: "20px",
                            backgroundColor: "var(--p-color-bg-fill-info)",
                            borderRadius: "var(--p-border-radius-100)",
                          }}
                        />
                      )}
                    </InlineStack>

                    <SkeletonDisplayText size="medium" />

                    <BlockStack gap="100">
                      <SkeletonBodyText lines={1} />
                      <SkeletonBodyText lines={1} />
                      <SkeletonBodyText lines={1} />
                    </BlockStack>

                    <div
                      style={{
                        width: "100px",
                        height: "36px",
                        backgroundColor: "var(--p-color-bg-fill-secondary)",
                        borderRadius: "var(--p-border-radius-200)",
                      }}
                    />
                  </BlockStack>
                </Box>
              </Card>
            ))}
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Comprehensive loading skeleton for the entire billing page
 */
export function BillingPageSkeleton() {
  return (
    <BlockStack gap="400">
      <SubscriptionCardSkeleton />
      <UsageMetricsSkeleton />
      <PlanActionsSkeleton />
      <BillingHistorySkeleton />
    </BlockStack>
  );
}

/**
 * Loading skeleton for unsubscribed users
 */
export function UnsubscribedUserSkeleton() {
  return <AvailablePlansSkeleton />;
}

/**
 * Inline loading skeleton for buttons and small components
 */
export function InlineLoadingSkeleton({
  width = "100px",
  height = "20px",
}: {
  width?: string;
  height?: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "var(--p-color-bg-fill-secondary)",
        borderRadius: "var(--p-border-radius-100)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

/**
 * Loading skeleton for error states with retry button
 */
export function ErrorStateSkeleton() {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <div
            style={{
              width: "100%",
              height: "60px",
              backgroundColor: "var(--p-color-bg-fill-critical-secondary)",
              borderRadius: "var(--p-border-radius-200)",
            }}
          />

          <InlineStack gap="300" wrap={false}>
            <div
              style={{
                width: "100px",
                height: "36px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-200)",
              }}
            />
            <div
              style={{
                width: "120px",
                height: "36px",
                backgroundColor: "var(--p-color-bg-fill-secondary)",
                borderRadius: "var(--p-border-radius-200)",
              }}
            />
          </InlineStack>

          <SkeletonBodyText lines={3} />
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Custom hook for managing loading states with skeletons
 */
export function useLoadingSkeletons() {
  const [loadingStates, setLoadingStates] = React.useState<
    Record<string, boolean>
  >({});

  const setLoading = React.useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = React.useCallback(
    (key: string) => loadingStates[key] || false,
    [loadingStates],
  );

  const isAnyLoading = React.useCallback(
    () => Object.values(loadingStates).some(Boolean),
    [loadingStates],
  );

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates,
  };
}
