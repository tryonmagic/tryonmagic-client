"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Banner,
} from "@shopify/polaris";
import { BillingErrorBoundary } from "./error-boundary";
import {
  ComprehensiveErrorHandler,
  useComprehensiveErrorHandling,
} from "./comprehensive-error-handler";
import {
  EnhancedErrorDisplay,
  getUserFriendlyErrorMessage,
  useEnhancedErrorHandling,
} from "../hooks/use-retry";
import { BillingApiError } from "../types";
import {
  SubscriptionCardSkeleton,
  UsageMetricsSkeleton,
  PlanActionsSkeleton,
} from "./loading-skeletons";

/**
 * Component that demonstrates error boundary functionality
 */
function ErrorBoundaryExample() {
  const [shouldThrow, setShouldThrow] = useState(false);

  const ThrowingComponent = () => {
    if (shouldThrow) {
      throw new Error("This is a test error from the error boundary example");
    }
    return (
      <Text variant="bodyMd" as="p">
        No error - component is working normally
      </Text>
    );
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Error Boundary Example
          </Text>

          <Button
            onClick={() => setShouldThrow(!shouldThrow)}
            tone={shouldThrow ? "success" : "critical"}
          >
            {shouldThrow ? "Fix Error" : "Trigger Error"}
          </Button>

          <BillingErrorBoundary supportEmail="support@example.com">
            <ThrowingComponent />
          </BillingErrorBoundary>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Component that demonstrates enhanced error display
 */
function EnhancedErrorExample() {
  const [errorType, setErrorType] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const createMockError = (type: string): BillingApiError => {
    const errors: Record<string, BillingApiError> = {
      network: {
        error: {
          code: "NETWORK_ERROR",
          message: "Network connection failed",
        },
        timestamp: new Date().toISOString(),
      },
      session: {
        error: {
          code: "SESSION_EXPIRED",
          message: "Your session has expired",
        },
        timestamp: new Date().toISOString(),
      },
      server: {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error occurred",
        },
        timestamp: new Date().toISOString(),
      },
      rateLimit: {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
        },
        timestamp: new Date().toISOString(),
      },
    };

    return errors[type] || errors.network;
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    if (retryCount >= 2) {
      setErrorType(null);
      setRetryCount(0);
    }
  };

  const handleClear = () => {
    setErrorType(null);
    setRetryCount(0);
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Enhanced Error Display Example
          </Text>

          <InlineStack gap="200" wrap>
            <Button
              size="slim"
              onClick={() => setErrorType("network")}
              variant={errorType === "network" ? "primary" : "secondary"}
            >
              Network Error
            </Button>
            <Button
              size="slim"
              onClick={() => setErrorType("session")}
              variant={errorType === "session" ? "primary" : "secondary"}
            >
              Session Error
            </Button>
            <Button
              size="slim"
              onClick={() => setErrorType("server")}
              variant={errorType === "server" ? "primary" : "secondary"}
            >
              Server Error
            </Button>
            <Button
              size="slim"
              onClick={() => setErrorType("rateLimit")}
              variant={errorType === "rateLimit" ? "primary" : "secondary"}
            >
              Rate Limit Error
            </Button>
            <Button size="slim" onClick={handleClear}>
              Clear Error
            </Button>
          </InlineStack>

          {errorType && (
            <EnhancedErrorDisplay
              error={createMockError(errorType)}
              onRetry={handleRetry}
              onClear={handleClear}
              retryAttempts={retryCount}
              maxRetryAttempts={3}
              supportEmail="support@example.com"
              showTechnicalDetails={true}
            />
          )}

          {!errorType && (
            <Banner tone="success">
              <Text variant="bodyMd" as="p">
                No errors - select an error type above to see the enhanced error
                display
              </Text>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Component that demonstrates comprehensive error handling
 */
function ComprehensiveErrorExample() {
  const errorHandling = useComprehensiveErrorHandling({
    maxRetryAttempts: 3,
    supportEmail: "support@example.com",
    componentName: "comprehensive error example",
  });

  const [isLoading, setIsLoading] = useState(false);

  const simulateApiCall = async () => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Randomly succeed or fail
    if (Math.random() > 0.5) {
      throw new Error("Simulated API failure");
    }

    setIsLoading(false);
  };

  const handleTriggerError = () => {
    errorHandling.handleError(new Error("Manual error trigger"));
  };

  const handleSimulateApiCall = async () => {
    try {
      await simulateApiCall();
      errorHandling.clearError();
    } catch (error) {
      errorHandling.handleError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryApiCall = () => {
    errorHandling.retry(simulateApiCall);
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Comprehensive Error Handling Example
          </Text>

          <InlineStack gap="200" wrap>
            <Button onClick={handleTriggerError}>Trigger Error</Button>
            <Button onClick={handleSimulateApiCall} loading={isLoading}>
              Simulate API Call
            </Button>
            <Button onClick={errorHandling.clearError}>Clear Error</Button>
          </InlineStack>

          {errorHandling.error && (
            <Text variant="bodySm" as="p" tone="subdued">
              Retry attempts: {errorHandling.retryAttempts} /{" "}
              {errorHandling.maxRetryAttempts}
            </Text>
          )}

          <ComprehensiveErrorHandler
            error={errorHandling.error}
            isLoading={isLoading}
            onRetry={handleRetryApiCall}
            onClear={errorHandling.clearError}
            retryAttempts={errorHandling.retryAttempts}
            maxRetryAttempts={errorHandling.maxRetryAttempts}
            supportEmail={errorHandling.supportEmail}
            componentName={errorHandling.componentName}
          >
            <Banner tone="success">
              <Text variant="bodyMd" as="p">
                Component is working normally - no errors detected
              </Text>
            </Banner>
          </ComprehensiveErrorHandler>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Component that demonstrates loading skeletons
 */
function LoadingSkeletonsExample() {
  const [activeSkeletons, setActiveSkeletons] = useState<string[]>([]);

  const toggleSkeleton = (skeleton: string) => {
    setActiveSkeletons((prev) =>
      prev.includes(skeleton)
        ? prev.filter((s) => s !== skeleton)
        : [...prev, skeleton],
    );
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Loading Skeletons Example
          </Text>

          <InlineStack gap="200" wrap>
            <Button
              size="slim"
              onClick={() => toggleSkeleton("subscription")}
              variant={
                activeSkeletons.includes("subscription")
                  ? "primary"
                  : "secondary"
              }
            >
              Subscription Card
            </Button>
            <Button
              size="slim"
              onClick={() => toggleSkeleton("usage")}
              variant={
                activeSkeletons.includes("usage") ? "primary" : "secondary"
              }
            >
              Usage Metrics
            </Button>
            <Button
              size="slim"
              onClick={() => toggleSkeleton("actions")}
              variant={
                activeSkeletons.includes("actions") ? "primary" : "secondary"
              }
            >
              Plan Actions
            </Button>
            <Button size="slim" onClick={() => setActiveSkeletons([])}>
              Clear All
            </Button>
          </InlineStack>

          <BlockStack gap="300">
            {activeSkeletons.includes("subscription") && (
              <Box>
                <Text variant="bodyMd" as="p" fontWeight="medium">
                  Subscription Card Skeleton:
                </Text>
                <Box paddingBlockStart="200">
                  <SubscriptionCardSkeleton />
                </Box>
              </Box>
            )}

            {activeSkeletons.includes("usage") && (
              <Box>
                <Text variant="bodyMd" as="p" fontWeight="medium">
                  Usage Metrics Skeleton:
                </Text>
                <Box paddingBlockStart="200">
                  <UsageMetricsSkeleton />
                </Box>
              </Box>
            )}

            {activeSkeletons.includes("actions") && (
              <Box>
                <Text variant="bodyMd" as="p" fontWeight="medium">
                  Plan Actions Skeleton:
                </Text>
                <Box paddingBlockStart="200">
                  <PlanActionsSkeleton />
                </Box>
              </Box>
            )}

            {activeSkeletons.length === 0 && (
              <Banner tone="info">
                <Text variant="bodyMd" as="p">
                  Select skeleton types above to see loading state examples
                </Text>
              </Banner>
            )}
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Component that demonstrates user-friendly error messages
 */
function ErrorMessageExample() {
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const errorExamples = {
    "Network Error": {
      error: { code: "NETWORK_ERROR", message: "Network failed" },
    },
    "Session Expired": {
      error: { code: "SESSION_EXPIRED", message: "Session expired" },
    },
    "Rate Limited": {
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    },
    "Server Error": {
      error: { code: "INTERNAL_ERROR", message: "Internal error" },
    },
    "HTTP 404": { status: 404 },
    "HTTP 500": { status: 500 },
    "Generic Error": new Error("Something went wrong"),
    "Network Fetch Error": new TypeError("fetch failed"),
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            User-Friendly Error Messages Example
          </Text>

          <InlineStack gap="200" wrap>
            {Object.keys(errorExamples).map((errorType) => (
              <Button
                key={errorType}
                size="slim"
                onClick={() => setSelectedError(errorType)}
                variant={selectedError === errorType ? "primary" : "secondary"}
              >
                {errorType}
              </Button>
            ))}
            <Button size="slim" onClick={() => setSelectedError(null)}>
              Clear
            </Button>
          </InlineStack>

          {selectedError && (
            <Box
              padding="300"
              background="bg-fill-info-secondary"
              borderRadius="200"
            >
              <BlockStack gap="200">
                <Text variant="bodyMd" as="p" fontWeight="medium">
                  Original Error:
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  {JSON.stringify(
                    errorExamples[selectedError as keyof typeof errorExamples],
                    null,
                    2,
                  )}
                </Text>
                <Text variant="bodyMd" as="p" fontWeight="medium">
                  User-Friendly Message:
                </Text>
                <Text variant="bodyMd" as="p">
                  {getUserFriendlyErrorMessage(
                    errorExamples[selectedError as keyof typeof errorExamples],
                  )}
                </Text>
              </BlockStack>
            </Box>
          )}

          {!selectedError && (
            <Banner tone="info">
              <Text variant="bodyMd" as="p">
                Select an error type above to see how it's converted to a
                user-friendly message
              </Text>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Main component that demonstrates all error handling features
 */
export function ErrorHandlingExamples() {
  return (
    <BlockStack gap="400">
      <Text variant="headingLg" as="h2">
        Billing Error Handling & Loading States Examples
      </Text>

      <Text variant="bodyMd" as="p" tone="subdued">
        This page demonstrates all the error handling and loading state features
        implemented for the billing system. Use the interactive examples below
        to test different error scenarios and loading states.
      </Text>

      <ErrorBoundaryExample />
      <EnhancedErrorExample />
      <ComprehensiveErrorExample />
      <LoadingSkeletonsExample />
      <ErrorMessageExample />
    </BlockStack>
  );
}
