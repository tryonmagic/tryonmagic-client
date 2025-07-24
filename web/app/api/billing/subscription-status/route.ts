import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";
import {
  SubscriptionStatusResponse,
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  UsageMetrics,
  Plan,
  BillingApiError,
} from "@/app/billing/types";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-shopify-session-token",
};

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * GraphQL query to fetch current app installation subscription data
 */
const GET_SUBSCRIPTION_STATUS_QUERY = `
  query GetSubscriptionStatus {
    currentAppInstallation {
      id
      activeSubscriptions {
        id
        name
        status
        createdAt
        currentPeriodEnd
        test
        trialDays
        lineItems {
          id
          plan {
            pricingDetails {
              __typename
              ... on AppRecurringPricing {
                interval
                price {
                  amount
                  currencyCode
                }
              }
              ... on AppUsagePricing {
                terms
                cappedAmount {
                  amount
                  currencyCode
                }
                balanceUsed {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
      allSubscriptions(first: 10) {
        edges {
          node {
            id
            name
            status
            createdAt
            currentPeriodEnd
            test
            trialDays
            lineItems {
              id
              plan {
                pricingDetails {
                  __typename
                  ... on AppRecurringPricing {
                    interval
                    price {
                      amount
                      currencyCode
                    }
                  }
                  ... on AppUsagePricing {
                    terms
                    cappedAmount {
                      amount
                      currencyCode
                    }
                    balanceUsed {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Convert Shopify app subscription status to our internal status enum
 */
function mapShopifyStatus(shopifyStatus: string): SubscriptionStatus {
  switch (shopifyStatus.toUpperCase()) {
    case "ACTIVE":
      return SubscriptionStatus.ACTIVE;
    case "CANCELLED":
      return SubscriptionStatus.CANCELLED;
    case "PENDING":
      return SubscriptionStatus.PENDING;
    case "EXPIRED":
      return SubscriptionStatus.EXPIRED;
    case "FROZEN":
      return SubscriptionStatus.EXPIRED; // Map frozen to expired for our purposes
    case "DECLINED":
      return SubscriptionStatus.CANCELLED; // Map declined to cancelled
    case "ACCEPTED":
      return SubscriptionStatus.PENDING; // Map accepted to pending until active
    default:
      return SubscriptionStatus.PENDING;
  }
}

/**
 * Convert Shopify billing interval to our billing cycle enum
 */
function mapBillingInterval(interval: string): BillingCycle {
  switch (interval) {
    case "EVERY_30_DAYS":
      return BillingCycle.MONTHLY;
    case "ANNUAL":
      return BillingCycle.YEARLY;
    default:
      return BillingCycle.MONTHLY;
  }
}

/**
 * Transform Shopify subscription data to our internal format
 */
function transformSubscription(
  shopifySubscription: any,
  shopDomain: string,
): Subscription {
  const lineItem = shopifySubscription.lineItems?.[0];
  const pricingDetails = lineItem?.plan?.pricingDetails;

  let price = 0;
  let currency = "USD";
  let billingCycle = BillingCycle.MONTHLY;

  if (pricingDetails) {
    if (pricingDetails.__typename === "AppRecurringPricing") {
      price = parseFloat(pricingDetails.price?.amount || "0");
      currency = pricingDetails.price?.currencyCode || "USD";
      billingCycle = mapBillingInterval(
        pricingDetails.interval || "EVERY_30_DAYS",
      );
    } else if (pricingDetails.__typename === "AppUsagePricing") {
      price = parseFloat(pricingDetails.cappedAmount?.amount || "0");
      currency = pricingDetails.cappedAmount?.currencyCode || "USD";
      billingCycle = BillingCycle.MONTHLY; // Usage-based typically monthly
    }
  }

  return {
    id: shopifySubscription.id.replace("gid://shopify/AppSubscription/", ""),
    shopDomain,
    planId: lineItem?.id || shopifySubscription.id,
    planName: shopifySubscription.name || "Unknown Plan",
    status: mapShopifyStatus(shopifySubscription.status),
    price,
    currency,
    billingCycle,
    createdAt: new Date(shopifySubscription.createdAt),
    updatedAt: new Date(), // We don't have updatedAt from the API
    nextBillingDate: shopifySubscription.currentPeriodEnd
      ? new Date(shopifySubscription.currentPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    cancelledAt:
      shopifySubscription.status === "CANCELLED" ? new Date() : undefined,
    trialEndsAt:
      shopifySubscription.trialDays > 0
        ? new Date(
            Date.now() + shopifySubscription.trialDays * 24 * 60 * 60 * 1000,
          )
        : undefined,
    shopifySubscriptionId: shopifySubscription.id,
  };
}

/**
 * Extract usage metrics from subscription data
 */
function extractUsageMetrics(
  shopifySubscription: any,
): UsageMetrics | undefined {
  const lineItem = shopifySubscription.lineItems?.[0];
  const pricingDetails = lineItem?.plan?.pricingDetails;

  if (pricingDetails?.__typename === "AppUsagePricing") {
    const balanceUsed = parseFloat(pricingDetails.balanceUsed?.amount || "0");
    const cappedAmount = parseFloat(pricingDetails.cappedAmount?.amount || "0");

    return {
      current: balanceUsed,
      limit: cappedAmount,
      unit: pricingDetails.terms || "usage",
    };
  }

  return undefined;
}

/**
 * Generate available plans for unsubscribed users
 */
function generateAvailablePlans(): Plan[] {
  return [
    {
      id: "basic",
      name: "Basic Plan",
      price: 9.99,
      currency: "USD",
      billingCycle: BillingCycle.MONTHLY,
      features: [
        "Basic image editing",
        "Up to 100 images per month",
        "Standard support",
      ],
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: 29.99,
      currency: "USD",
      billingCycle: BillingCycle.MONTHLY,
      features: [
        "Advanced image editing",
        "Up to 1000 images per month",
        "Priority support",
        "API access",
      ],
      isPopular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      price: 99.99,
      currency: "USD",
      billingCycle: BillingCycle.MONTHLY,
      features: [
        "All features included",
        "Unlimited images",
        "Dedicated support",
        "Custom integrations",
      ],
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    // Get the session token from the request headers
    const sessionToken =
      request.headers.get("x-shopify-session-token") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      const error: BillingApiError = {
        error: {
          code: "MISSING_SESSION_TOKEN",
          message:
            "No session token provided. Please provide a valid Shopify session token.",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify the session token and get shop/access token
    const { shop, session } = await verifyRequest(request, true);

    if (!shop || !session.accessToken) {
      const error: BillingApiError = {
        error: {
          code: "INVALID_SESSION",
          message: "Invalid or expired session token. Please re-authenticate.",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create GraphQL client
    const shopifyInstance = shopify();
    const client = new shopifyInstance.clients.Graphql({ session });

    // Execute the subscription status query
    const response = await client.query({
      data: GET_SUBSCRIPTION_STATUS_QUERY,
    });

    if (!response.body) {
      throw new Error("No response body from GraphQL query");
    }

    const data = response.body as any;

    if (data.errors && data.errors.length > 0) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(`GraphQL error: ${data.errors[0].message}`);
    }

    const appInstallation = data.data?.currentAppInstallation;

    if (!appInstallation) {
      const error: BillingApiError = {
        error: {
          code: "APP_NOT_INSTALLED",
          message: "App installation not found. Please reinstall the app.",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Process active subscriptions
    const activeSubscriptions = appInstallation.activeSubscriptions || [];
    let currentSubscription: Subscription | null = null;
    let usageMetrics: UsageMetrics | undefined = undefined;

    if (activeSubscriptions.length > 0) {
      // Get the first active subscription (apps typically have only one)
      const activeSubscription = activeSubscriptions[0];
      currentSubscription = transformSubscription(activeSubscription, shop);
      usageMetrics = extractUsageMetrics(activeSubscription);
    } else {
      // Check if there are any recent subscriptions (cancelled, expired, etc.)
      const allSubscriptions = appInstallation.allSubscriptions?.edges || [];
      if (allSubscriptions.length > 0) {
        // Get the most recent subscription
        const recentSubscription = allSubscriptions[0].node;
        currentSubscription = transformSubscription(recentSubscription, shop);
        usageMetrics = extractUsageMetrics(recentSubscription);
      }
    }

    // Prepare response
    const response_data: SubscriptionStatusResponse = {
      subscription: currentSubscription,
      usageMetrics,
      availablePlans: currentSubscription
        ? undefined
        : generateAvailablePlans(),
    };

    return NextResponse.json(response_data, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);

    // Handle specific error types
    let errorCode = "INTERNAL_ERROR";
    let errorMessage =
      "An unexpected error occurred while fetching subscription status.";

    if (error instanceof Error) {
      if (error.message.includes("Session not found")) {
        errorCode = "SESSION_NOT_FOUND";
        errorMessage = "Session not found or expired. Please re-authenticate.";
      } else if (error.message.includes("Invalid session")) {
        errorCode = "INVALID_SESSION";
        errorMessage = "Invalid session token. Please re-authenticate.";
      } else if (error.message.includes("GraphQL error")) {
        errorCode = "GRAPHQL_ERROR";
        errorMessage = error.message;
      } else if (error.message.includes("Network")) {
        errorCode = "NETWORK_ERROR";
        errorMessage = "Network error occurred. Please try again.";
      }
    }

    const apiError: BillingApiError = {
      error: {
        code: errorCode,
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? {
                originalError:
                  error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              }
            : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(apiError, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way as GET for flexibility
  return GET(request);
}
