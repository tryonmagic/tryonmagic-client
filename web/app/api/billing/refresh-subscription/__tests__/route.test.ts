import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// Mock the dependencies
jest.mock("@/lib/shopify/verify", () => ({
  verifyRequest: jest.fn(),
}));

jest.mock("@/lib/shopify/initialize-context", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/app/billing/types", () => ({
  SubscriptionStatus: {
    ACTIVE: "active",
    CANCELLED: "cancelled",
    PENDING: "pending",
    EXPIRED: "expired",
    TRIAL: "trial",
  },
  BillingCycle: {
    MONTHLY: "monthly",
    YEARLY: "yearly",
  },
}));

describe("/api/billing/refresh-subscription", () => {
  const mockVerifyRequest = require("@/lib/shopify/verify").verifyRequest;
  const mockShopify = require("@/lib/shopify/initialize-context").default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests", () => {
    it("should handle webhook requests", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription",
        {
          method: "GET",
          headers: {
            "x-shopify-topic": "app_subscriptions/update",
            "x-shopify-shop-domain": "test-shop.myshopify.com",
            "x-shopify-hmac-sha256": "test-hmac",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.topic).toBe("app_subscriptions/update");
    });

    it("should handle subscription refresh requests", async () => {
      const mockSession = {
        accessToken: "test-token",
        shop: "test-shop.myshopify.com",
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          body: {
            data: {
              currentAppInstallation: {
                id: "test-installation",
                activeSubscriptions: [
                  {
                    id: "gid://shopify/AppSubscription/123",
                    name: "Test Plan",
                    status: "ACTIVE",
                    createdAt: "2023-01-01T00:00:00Z",
                    currentPeriodEnd: "2023-02-01T00:00:00Z",
                    test: false,
                    trialDays: 0,
                    lineItems: [
                      {
                        id: "test-line-item",
                        plan: {
                          pricingDetails: {
                            __typename: "AppRecurringPricing",
                            interval: "EVERY_30_DAYS",
                            price: {
                              amount: "29.99",
                              currencyCode: "USD",
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
                allSubscriptions: { edges: [] },
              },
            },
          },
        }),
      };

      mockVerifyRequest.mockResolvedValue({
        shop: "test-shop.myshopify.com",
        session: mockSession,
      });

      mockShopify.mockReturnValue({
        clients: {
          Graphql: jest.fn().mockImplementation(() => mockClient),
        },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription?shopDomain=test-shop.myshopify.com",
        {
          method: "GET",
          headers: {
            "x-shopify-session-token": "test-session-token",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscription).toBeDefined();
      expect(data.subscription.planName).toBe("Test Plan");
      expect(data.subscription.status).toBe("active");
    });

    it("should return error for missing session token", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription?shopDomain=test-shop.myshopify.com",
        {
          method: "GET",
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("MISSING_SESSION_TOKEN");
    });
  });

  describe("POST requests", () => {
    it("should handle webhook requests", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription",
        {
          method: "POST",
          headers: {
            "x-shopify-topic": "app_subscriptions/create",
            "x-shopify-shop-domain": "test-shop.myshopify.com",
            "x-shopify-hmac-sha256": "test-hmac",
          },
          body: JSON.stringify({ subscription: { id: "123" } }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.topic).toBe("app_subscriptions/create");
    });

    it("should handle subscription refresh requests with body", async () => {
      const mockSession = {
        accessToken: "test-token",
        shop: "test-shop.myshopify.com",
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          body: {
            data: {
              currentAppInstallation: {
                id: "test-installation",
                activeSubscriptions: [],
                allSubscriptions: { edges: [] },
              },
            },
          },
        }),
      };

      mockVerifyRequest.mockResolvedValue({
        shop: "test-shop.myshopify.com",
        session: mockSession,
      });

      mockShopify.mockReturnValue({
        clients: {
          Graphql: jest.fn().mockImplementation(() => mockClient),
        },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription",
        {
          method: "POST",
          headers: {
            "x-shopify-session-token": "test-session-token",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            shopDomain: "test-shop.myshopify.com",
            subscriptionId: "123",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscription).toBeNull(); // No active subscriptions in mock
    });

    it("should return error for invalid JSON body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: "invalid json",
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_REQUEST_BODY");
    });
  });

  describe("Webhook signature verification", () => {
    it("should reject webhooks with invalid signatures when secret is set", async () => {
      // Set webhook secret for this test
      process.env.SHOPIFY_WEBHOOK_SECRET = "test-secret";

      const request = new NextRequest(
        "http://localhost:3000/api/billing/refresh-subscription",
        {
          method: "POST",
          headers: {
            "x-shopify-topic": "app_subscriptions/update",
            "x-shopify-shop-domain": "test-shop.myshopify.com",
            "x-shopify-hmac-sha256": "invalid-signature",
          },
          body: JSON.stringify({ test: "data" }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("INVALID_WEBHOOK_SIGNATURE");

      // Clean up
      delete process.env.SHOPIFY_WEBHOOK_SECRET;
    });
  });
});
