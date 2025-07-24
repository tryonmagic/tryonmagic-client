import React from "react";
import { render, screen } from "@testing-library/react";
import { UsageMetricsComponent } from "../usage-metrics";
import { UsageMetrics } from "../../types";

// Mock Shopify Polaris components
jest.mock("@shopify/polaris", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  Text: ({
    children,
    tone,
    variant,
  }: {
    children: React.ReactNode;
    tone?: string;
    variant?: string;
  }) => (
    <span data-testid="text" data-tone={tone} data-variant={variant}>
      {children}
    </span>
  ),
  Box: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
  BlockStack: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="block-stack">{children}</div>
  ),
  InlineStack: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="inline-stack">{children}</div>
  ),
  ProgressBar: ({ progress, color }: { progress: number; color: string }) => (
    <div
      data-testid="progress-bar"
      data-progress={progress}
      data-color={color}
    />
  ),
  Badge: ({ children, tone }: { children: React.ReactNode; tone: string }) => (
    <span data-testid="badge" data-tone={tone}>
      {children}
    </span>
  ),
}));

describe("UsageMetricsComponent", () => {
  const mockUsageMetrics: UsageMetrics = {
    current: 500,
    limit: 1000,
    unit: "API calls",
  };

  it("renders usage metrics when data is available", () => {
    render(
      <UsageMetricsComponent
        usageMetrics={mockUsageMetrics}
        planName="Pro Plan"
      />,
    );

    expect(screen.getByText("Usage Metrics")).toBeInTheDocument();
    expect(screen.getByText("500 / 1,000 API calls")).toBeInTheDocument();
    expect(screen.getByText("50% used")).toBeInTheDocument();
    expect(screen.getByText("Remaining: 500 API calls")).toBeInTheDocument();
    expect(screen.getByText("Plan: Pro Plan")).toBeInTheDocument();
  });

  it("shows normal usage status for low usage", () => {
    const lowUsageMetrics: UsageMetrics = {
      current: 100,
      limit: 1000,
      unit: "requests",
    };

    render(<UsageMetricsComponent usageMetrics={lowUsageMetrics} />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-tone", "success");
    expect(badge).toHaveTextContent("Normal usage");
  });

  it("shows high usage status for 75-89% usage", () => {
    const highUsageMetrics: UsageMetrics = {
      current: 800,
      limit: 1000,
      unit: "requests",
    };

    render(<UsageMetricsComponent usageMetrics={highUsageMetrics} />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-tone", "attention");
    expect(badge).toHaveTextContent("High usage");
  });

  it("shows warning status for 90-99% usage", () => {
    const warningUsageMetrics: UsageMetrics = {
      current: 950,
      limit: 1000,
      unit: "requests",
    };

    render(<UsageMetricsComponent usageMetrics={warningUsageMetrics} />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-tone", "warning");
    expect(badge).toHaveTextContent("Approaching usage limit");
    expect(
      screen.getByText("You are approaching your usage limit"),
    ).toBeInTheDocument();
  });

  it("shows critical status for 100%+ usage", () => {
    const criticalUsageMetrics: UsageMetrics = {
      current: 1200,
      limit: 1000,
      unit: "requests",
    };

    render(<UsageMetricsComponent usageMetrics={criticalUsageMetrics} />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-tone", "critical");
    expect(badge).toHaveTextContent("Usage limit exceeded");
    expect(
      screen.getByText("You have exceeded your usage limit"),
    ).toBeInTheDocument();
  });

  it("handles case when usage metrics are not available", () => {
    render(<UsageMetricsComponent />);

    expect(screen.getByText("Usage Metrics")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Usage metrics are not available for your current plan.",
      ),
    ).toBeInTheDocument();
  });

  it("handles zero limit gracefully", () => {
    const zeroLimitMetrics: UsageMetrics = {
      current: 0,
      limit: 0,
      unit: "requests",
    };

    render(<UsageMetricsComponent usageMetrics={zeroLimitMetrics} />);

    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toHaveAttribute("data-progress", "0");
  });

  it("caps usage percentage at 100% for display", () => {
    const overLimitMetrics: UsageMetrics = {
      current: 2000,
      limit: 1000,
      unit: "requests",
    };

    render(<UsageMetricsComponent usageMetrics={overLimitMetrics} />);

    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toHaveAttribute("data-progress", "100");
  });
});
