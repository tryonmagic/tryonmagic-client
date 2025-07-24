"use client";

import React, { Component, ReactNode } from "react";
import {
  Card,
  Text,
  Button,
  Box,
  BlockStack,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { BillingError } from "../types";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  retryText?: string;
  supportEmail?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary component for billing components
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
export class BillingErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error("BillingErrorBoundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // Example: reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleContactSupport = () => {
    const { supportEmail = "support@example.com" } = this.props;
    const { error } = this.state;

    const subject = encodeURIComponent("Billing Page Error Report");
    const body = encodeURIComponent(
      `I encountered an error on the billing page:\n\n` +
        `Error: ${error?.message || "Unknown error"}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `User Agent: ${navigator.userAgent}\n\n` +
        `Please help me resolve this issue.`,
    );

    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const {
      children,
      fallback,
      showRetry = true,
      retryText = "Try Again",
    } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Banner tone="critical">
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">
                    Something went wrong
                  </Text>
                  <Text variant="bodyMd" as="p">
                    We encountered an unexpected error while loading the billing
                    information. This might be a temporary issue.
                  </Text>
                </BlockStack>
              </Banner>

              {/* Error details in development */}
              {process.env.NODE_ENV === "development" && error && (
                <Box
                  padding="300"
                  background="bg-fill-critical-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Error Details (Development Only)
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {error.message}
                    </Text>
                    {error.stack && (
                      <div
                        style={{
                          fontSize: "12px",
                          overflow: "auto",
                          maxHeight: "200px",
                          whiteSpace: "pre-wrap",
                          fontFamily: "monospace",
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f6f6f7",
                          borderRadius: "4px",
                        }}
                      >
                        <Text variant="bodySm" as="span" tone="subdued">
                          {error.stack}
                        </Text>
                      </div>
                    )}
                  </BlockStack>
                </Box>
              )}

              {/* Action buttons */}
              <InlineStack gap="300" wrap={false}>
                {showRetry && retryCount < this.maxRetries && (
                  <Button variant="primary" onClick={this.handleRetry}>
                    {retryText}
                  </Button>
                )}

                <Button variant="secondary" onClick={this.handleReload}>
                  Reload Page
                </Button>

                <Button variant="secondary" onClick={this.handleContactSupport}>
                  Contact Support
                </Button>
              </InlineStack>

              {/* Retry information */}
              {retryCount > 0 && (
                <Box paddingBlockStart="200">
                  <Text variant="bodySm" as="p" tone="subdued">
                    Retry attempts: {retryCount} / {this.maxRetries}
                  </Text>
                </Box>
              )}

              {retryCount >= this.maxRetries && (
                <Box paddingBlockStart="200">
                  <Text variant="bodySm" as="p" tone="critical">
                    Maximum retry attempts reached. Please reload the page or
                    contact support if the problem persists.
                  </Text>
                </Box>
              )}

              {/* Helpful information */}
              <Box paddingBlockStart="200">
                <BlockStack gap="100">
                  <Text variant="bodySm" as="p" tone="subdued">
                    If this problem continues, try:
                  </Text>
                  <Box paddingInlineStart="200">
                    <BlockStack gap="100">
                      <Text variant="bodySm" as="p" tone="subdued">
                        • Refreshing the page
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        • Clearing your browser cache
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        • Checking your internet connection
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        • Contacting support with the error details
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Box>
            </BlockStack>
          </Box>
        </Card>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  const WrappedComponent = (props: P) => (
    <BillingErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BillingErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Hook to handle errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Error handled by useErrorHandler:", error);
    setError(error);

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // Example: reportError(error);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

/**
 * Enhanced error boundary with better user experience
 */
export function EnhancedBillingErrorBoundary({
  children,
  fallback,
  onError,
  showRetry = true,
  retryText = "Try Again",
  supportEmail = "support@example.com",
  componentName = "billing component",
}: ErrorBoundaryProps & { componentName?: string }) {
  return (
    <BillingErrorBoundary
      fallback={fallback}
      onError={onError}
      showRetry={showRetry}
      retryText={retryText}
      supportEmail={supportEmail}
    >
      {children}
    </BillingErrorBoundary>
  );
}

/**
 * Specialized error boundary for API-related errors
 */
export function ApiBillingErrorBoundary({
  children,
  apiName = "billing API",
  supportEmail = "support@example.com",
}: {
  children: ReactNode;
  apiName?: string;
  supportEmail?: string;
}) {
  const fallback = (
    <Card>
      <Box padding="400">
        <Banner tone="critical">
          <BlockStack gap="200">
            <Text variant="headingMd" as="h3">
              {apiName} Error
            </Text>
            <Text variant="bodyMd" as="p">
              We're having trouble connecting to our {apiName}. This might be a
              temporary issue.
            </Text>
            <Text variant="bodyMd" as="p">
              If this problem persists, please contact support at{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </Text>
          </BlockStack>
        </Banner>
      </Box>
    </Card>
  );

  return (
    <BillingErrorBoundary fallback={fallback} supportEmail={supportEmail}>
      {children}
    </BillingErrorBoundary>
  );
}
