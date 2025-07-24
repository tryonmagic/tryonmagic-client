"use client";

import React, { ReactNode } from "react";
import {
  Banner,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
  Card,
} from "@shopify/polaris";
import { BillingApiError } from "../types";
import {
  getUserFriendlyErrorMessage,
  EnhancedErrorDisplay,
  useEnhancedErrorHandling,
} from "../hooks/use-retry";
import { BillingErrorBoundary } from "./error-boundary";

interface ComprehensiveErrorHandlerProps {
  children: ReactNode;
  error?: BillingApiError | Error | null;
  isLoading?: boolean;
  onRetry?: () => void;
  onClear?: () => void;
  retryAttempts?: number;
  maxRetryAttempts?: number;
  supportEmail?: string;
  componentName?: string;
  showTechnicalDetails?: boolean;
  fallbackComponent?: ReactNode;
}

/**
 * Comprehensive error handler that combines error boundaries, retry logic,
 * and user-friendly error messages for billing components
 */
export function ComprehensiveErrorHandler({
  children,
  error,
  isLoading = false,
  onRetry,
  onClear,
  retryAttempts = 0,
  maxRetryAttempts = 3,
  supportEmail = "support@example.com",
  componentName = "billing component",
  showTechnicalDetails = process.env.NODE_ENV === "development",
  fallbackComponent,
}: ComprehensiveErrorHandlerProps) {
  // If there's an error, show the error display
  if (error && !isLoading) {
    return (
      <BillingErrorBoundary
        supportEmail={supportEmail}
        fallback={fallbackComponent}
      >
        <EnhancedErrorDisplay
          error={error}
          onRetry={onRetry}
          onClear={onClear}
          supportEmail={supportEmail}
          showTechnicalDetails={showTechnicalDetails}
          retryAttempts={retryAttempts}
          maxRetryAttempts={maxRetryAttempts}
        />
      </BillingErrorBoundary>
    );
  }

  // Otherwise, wrap children in error boundary
  return (
    <BillingErrorBoundary
      supportEmail={supportEmail}
      fallback={fallbackComponent}
      onError={(error, errorInfo) => {
        console.error(`Error in ${componentName}:`, error, errorInfo);
      }}
    >
      {children}
    </BillingErrorBoundary>
  );
}

/**
 * Hook for managing comprehensive error handling state
 */
export function useComprehensiveErrorHandling(
  options: {
    maxRetryAttempts?: number;
    supportEmail?: string;
    componentName?: string;
  } = {},
) {
  const {
    maxRetryAttempts = 3,
    supportEmail = "support@example.com",
    componentName = "billing component",
  } = options;

  const { lastError, userFriendlyMessage, handleError, clearError } =
    useEnhancedErrorHandling();

  const [retryAttempts, setRetryAttempts] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = React.useCallback(
    async (retryFunction: () => Promise<void>) => {
      if (retryAttempts >= maxRetryAttempts) {
        return;
      }

      setIsRetrying(true);
      setRetryAttempts((prev) => prev + 1);

      try {
        await retryFunction();
        // Success - reset error state
        clearError();
        setRetryAttempts(0);
      } catch (error) {
        handleError(error);
      } finally {
        setIsRetrying(false);
      }
    },
    [retryAttempts, maxRetryAttempts, handleError, clearError],
  );

  const reset = React.useCallback(() => {
    clearError();
    setRetryAttempts(0);
    setIsRetrying(false);
  }, [clearError]);

  return {
    error: lastError,
    userFriendlyMessage,
    retryAttempts,
    maxRetryAttempts,
    isRetrying,
    canRetry: retryAttempts < maxRetryAttempts,
    handleError,
    clearError: reset,
    retry,
    supportEmail,
    componentName,
  };
}

/**
 * Higher-order component that wraps components with comprehensive error handling
 */
export function withComprehensiveErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    supportEmail?: string;
    componentName?: string;
    showTechnicalDetails?: boolean;
  } = {},
) {
  const WrappedComponent = (props: P) => {
    const errorHandling = useComprehensiveErrorHandling({
      supportEmail: options.supportEmail,
      componentName: options.componentName,
    });

    return (
      <ComprehensiveErrorHandler
        error={errorHandling.error}
        onClear={errorHandling.clearError}
        retryAttempts={errorHandling.retryAttempts}
        maxRetryAttempts={errorHandling.maxRetryAttempts}
        supportEmail={errorHandling.supportEmail}
        componentName={errorHandling.componentName}
        showTechnicalDetails={options.showTechnicalDetails}
      >
        <Component {...props} />
      </ComprehensiveErrorHandler>
    );
  };

  WrappedComponent.displayName = `withComprehensiveErrorHandling(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Specialized error handler for API operations
 */
export function ApiErrorHandler({
  children,
  apiName = "billing API",
  error,
  isLoading,
  onRetry,
  supportEmail = "support@example.com",
}: {
  children: ReactNode;
  apiName?: string;
  error?: BillingApiError | Error | null;
  isLoading?: boolean;
  onRetry?: () => void;
  supportEmail?: string;
}) {
  if (error && !isLoading) {
    return (
      <Card>
        <Box padding="400">
          <Banner tone="critical">
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">
                {apiName} Error
              </Text>
              <Text variant="bodyMd" as="p">
                {getUserFriendlyErrorMessage(error)}
              </Text>
              <InlineStack gap="200">
                {onRetry && (
                  <Button size="slim" onClick={onRetry}>
                    Try Again
                  </Button>
                )}
                <Button
                  size="slim"
                  variant="secondary"
                  onClick={() => {
                    const subject = encodeURIComponent(
                      `${apiName} Error Report`,
                    );
                    const body = encodeURIComponent(
                      `I encountered an error with the ${apiName}:\n\n` +
                        `Error: ${getUserFriendlyErrorMessage(error)}\n` +
                        `Time: ${new Date().toISOString()}\n` +
                        `User Agent: ${navigator.userAgent}\n\n` +
                        `Please help me resolve this issue.`,
                    );
                    window.open(
                      `mailto:${supportEmail}?subject=${subject}&body=${body}`,
                    );
                  }}
                >
                  Contact Support
                </Button>
              </InlineStack>
            </BlockStack>
          </Banner>
        </Box>
      </Card>
    );
  }

  return <>{children}</>;
}

/**
 * Loading state wrapper with error handling
 */
export function LoadingStateWrapper({
  isLoading,
  error,
  loadingSkeleton,
  onRetry,
  children,
  supportEmail = "support@example.com",
}: {
  isLoading: boolean;
  error?: BillingApiError | Error | null;
  loadingSkeleton: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
  supportEmail?: string;
}) {
  if (isLoading) {
    return <>{loadingSkeleton}</>;
  }

  if (error) {
    return (
      <ComprehensiveErrorHandler
        error={error}
        onRetry={onRetry}
        supportEmail={supportEmail}
      >
        {children}
      </ComprehensiveErrorHandler>
    );
  }

  return <>{children}</>;
}
