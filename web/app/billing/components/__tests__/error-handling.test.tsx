import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BillingErrorBoundary } from "../error-boundary";
import { ComprehensiveErrorHandler } from "../comprehensive-error-handler";
import { EnhancedErrorDisplay } from "../../hooks/use-retry";
import { BillingApiError } from "../../types";

// Mock component that throws an error
const ErrorThrowingComponent = ({
  shouldThrow = false,
}: {
  shouldThrow?: boolean;
}) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

// Mock component for testing
const TestComponent = () => <div>Test component</div>;

// Create a wrapper with QueryClient for tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("Error Handling Components", () => {
  beforeEach(() => {
    // Clear console errors for clean test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("BillingErrorBoundary", () => {
    it("should render children when no error occurs", () => {
      render(
        <BillingErrorBoundary>
          <TestComponent />
        </BillingErrorBoundary>,
      );

      expect(screen.getByText("Test component")).toBeInTheDocument();
    });

    it("should catch and display error when child component throws", () => {
      render(
        <BillingErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </BillingErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText(/We encountered an unexpected error/),
      ).toBeInTheDocument();
    });

    it("should show retry button and handle retry attempts", () => {
      render(
        <BillingErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </BillingErrorBoundary>,
      );

      const retryButton = screen.getByText("Try Again");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(screen.getByText("Retry attempts: 1 / 3")).toBeInTheDocument();
    });

    it("should show contact support button", () => {
      const mockOpen = jest.fn();
      Object.defineProperty(window, "open", { value: mockOpen });

      render(
        <BillingErrorBoundary supportEmail="test@example.com">
          <ErrorThrowingComponent shouldThrow={true} />
        </BillingErrorBoundary>,
      );

      const supportButton = screen.getByText("Contact Support");
      fireEvent.click(supportButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("mailto:test@example.com"),
      );
    });

    it("should disable retry after max attempts", () => {
      render(
        <BillingErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </BillingErrorBoundary>,
      );

      const retryButton = screen.getByText("Try Again");

      // Click retry 3 times (max attempts)
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(
        screen.getByText(/Maximum retry attempts reached/),
      ).toBeInTheDocument();
      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });
  });

  describe("EnhancedErrorDisplay", () => {
    const mockBillingError: BillingApiError = {
      error: {
        code: "NETWORK_ERROR",
        message: "Network connection failed",
      },
      timestamp: new Date().toISOString(),
    };

    it("should display user-friendly error message", () => {
      render(
        <EnhancedErrorDisplay
          error={mockBillingError}
          supportEmail="test@example.com"
        />,
      );

      expect(
        screen.getByText(/Unable to connect to our servers/),
      ).toBeInTheDocument();
    });

    it("should show retry button when onRetry is provided", () => {
      const mockRetry = jest.fn();

      render(
        <EnhancedErrorDisplay
          error={mockBillingError}
          onRetry={mockRetry}
          supportEmail="test@example.com"
        />,
      );

      const retryButton = screen.getByText("Try Again");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it("should show technical details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      render(
        <EnhancedErrorDisplay
          error={mockBillingError}
          showTechnicalDetails={true}
          supportEmail="test@example.com"
        />,
      );

      expect(screen.getByText(/Technical details:/)).toBeInTheDocument();
      expect(screen.getByText(/Network connection failed/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle different error codes with appropriate messages", () => {
      const sessionError: BillingApiError = {
        error: {
          code: "SESSION_EXPIRED",
          message: "Session has expired",
        },
        timestamp: new Date().toISOString(),
      };

      render(
        <EnhancedErrorDisplay
          error={sessionError}
          supportEmail="test@example.com"
        />,
      );

      expect(screen.getByText(/Your session has expired/)).toBeInTheDocument();
    });

    it("should show retry attempts counter", () => {
      render(
        <EnhancedErrorDisplay
          error={mockBillingError}
          retryAttempts={2}
          maxRetryAttempts={3}
          supportEmail="test@example.com"
        />,
      );

      expect(screen.getByText("Retry attempts: 2 of 3")).toBeInTheDocument();
    });

    it("should disable retry when max attempts reached", () => {
      render(
        <EnhancedErrorDisplay
          error={mockBillingError}
          onRetry={jest.fn()}
          retryAttempts={3}
          maxRetryAttempts={3}
          supportEmail="test@example.com"
        />,
      );

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
      expect(
        screen.getByText(/Maximum retry attempts reached/),
      ).toBeInTheDocument();
    });
  });

  describe("ComprehensiveErrorHandler", () => {
    it("should render children when no error", () => {
      render(
        <ComprehensiveErrorHandler>
          <TestComponent />
        </ComprehensiveErrorHandler>,
      );

      expect(screen.getByText("Test component")).toBeInTheDocument();
    });

    it("should display error when error prop is provided", () => {
      const error = new Error("Test error");

      render(
        <ComprehensiveErrorHandler error={error}>
          <TestComponent />
        </ComprehensiveErrorHandler>,
      );

      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });

    it("should use fallback component when provided", () => {
      const error = new Error("Test error");
      const fallback = <div>Custom fallback</div>;

      render(
        <ComprehensiveErrorHandler error={error} fallbackComponent={fallback}>
          <TestComponent />
        </ComprehensiveErrorHandler>,
      );

      expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    });

    it("should handle retry functionality", () => {
      const error = new Error("Test error");
      const mockRetry = jest.fn();

      render(
        <ComprehensiveErrorHandler error={error} onRetry={mockRetry}>
          <TestComponent />
        </ComprehensiveErrorHandler>,
      );

      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe("Error Message Utilities", () => {
    it("should generate appropriate messages for different error types", () => {
      const { getUserFriendlyErrorMessage } = require("../../hooks/use-retry");

      // Test network error
      const networkError = {
        error: { code: "NETWORK_ERROR", message: "Network failed" },
      };
      expect(getUserFriendlyErrorMessage(networkError)).toContain(
        "Unable to connect to our servers",
      );

      // Test session error
      const sessionError = {
        error: { code: "SESSION_EXPIRED", message: "Session expired" },
      };
      expect(getUserFriendlyErrorMessage(sessionError)).toContain(
        "Your session has expired",
      );

      // Test HTTP error
      const httpError = { status: 500 };
      expect(getUserFriendlyErrorMessage(httpError)).toContain("Server error");

      // Test generic error
      const genericError = new Error("Generic error");
      expect(getUserFriendlyErrorMessage(genericError)).toContain(
        "Generic error",
      );
    });
  });
});

describe("Loading States", () => {
  it("should show loading skeleton while loading", () => {
    const { LoadingStateWrapper } = require("../comprehensive-error-handler");
    const loadingSkeleton = <div>Loading skeleton</div>;

    render(
      <LoadingStateWrapper isLoading={true} loadingSkeleton={loadingSkeleton}>
        <TestComponent />
      </LoadingStateWrapper>,
    );

    expect(screen.getByText("Loading skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Test component")).not.toBeInTheDocument();
  });

  it("should show children when not loading and no error", () => {
    const { LoadingStateWrapper } = require("../comprehensive-error-handler");
    const loadingSkeleton = <div>Loading skeleton</div>;

    render(
      <LoadingStateWrapper isLoading={false} loadingSkeleton={loadingSkeleton}>
        <TestComponent />
      </LoadingStateWrapper>,
    );

    expect(screen.getByText("Test component")).toBeInTheDocument();
    expect(screen.queryByText("Loading skeleton")).not.toBeInTheDocument();
  });

  it("should show error when error is present", () => {
    const { LoadingStateWrapper } = require("../comprehensive-error-handler");
    const loadingSkeleton = <div>Loading skeleton</div>;
    const error = new Error("Test error");

    render(
      <LoadingStateWrapper
        isLoading={false}
        error={error}
        loadingSkeleton={loadingSkeleton}
      >
        <TestComponent />
      </LoadingStateWrapper>,
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    expect(screen.queryByText("Test component")).not.toBeInTheDocument();
  });
});

describe("Integration Tests", () => {
  const Wrapper = createWrapper();

  it("should handle complete error flow with retry", async () => {
    let shouldThrow = true;
    const mockRetry = jest.fn(() => {
      shouldThrow = false;
    });

    const TestComponentWithRetry = () => {
      if (shouldThrow) {
        throw new Error("Temporary error");
      }
      return <div>Success after retry</div>;
    };

    const { rerender } = render(
      <Wrapper>
        <ComprehensiveErrorHandler onRetry={mockRetry}>
          <TestComponentWithRetry />
        </ComprehensiveErrorHandler>
      </Wrapper>,
    );

    // Should show error initially
    expect(screen.getByText(/Temporary error/)).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();

    // Rerender with shouldThrow = false
    rerender(
      <Wrapper>
        <ComprehensiveErrorHandler onRetry={mockRetry}>
          <TestComponentWithRetry />
        </ComprehensiveErrorHandler>
      </Wrapper>,
    );

    expect(screen.getByText("Success after retry")).toBeInTheDocument();
  });

  it("should handle support contact flow", () => {
    const mockOpen = jest.fn();
    Object.defineProperty(window, "open", { value: mockOpen });

    render(
      <Wrapper>
        <ComprehensiveErrorHandler
          error={new Error("Support needed")}
          supportEmail="help@example.com"
        >
          <TestComponent />
        </ComprehensiveErrorHandler>
      </Wrapper>,
    );

    const supportButton = screen.getByText("Contact Support");
    fireEvent.click(supportButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("mailto:help@example.com"),
    );
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("Support needed"),
    );
  });
});
