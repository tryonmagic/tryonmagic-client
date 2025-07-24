import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";
import {
  SubscriptionRefreshRequest,
  SubscriptionRefreshResponse,
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  BillingApiError,
} from "@/app/billing/types";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-shopify-session-token, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * GraphQL query to fetch current app installation subscription data
 */
const GET_SUBSCRIPTION_STATUS_QUERY = `
  query GetSubscriptionStatus($subscriptionId: ID) {
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
    node(id: $subscriptionId) {
      ... on AppSubscription {
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
 * Verify webhook authenticity using HMAC
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body, "utf8");
    const calculatedSignature = hmac.digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(calculatedSignature, "base64"),
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Handle webhook requests for subscription updates
 */
async function handleWebhook(request: NextRequest): Promise<NextResponse> {
  try {
    // Get webhook headers
    const topic = request.headers.get("x-shopify-topic");
    const shopDomain = request.headers.get("x-shopify-shop-domain");
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");

    if (!topic || !shopDomain || !hmacHeader) {
      const error: BillingApiError = {
        error: {
          code: "INVALID_WEBHOOK",
          message: "Missing required webhook headers",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get webhook body
    const body = await request.text();

    // Verify webhook signature
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (
      webhookSecret &&
      !verifyWebhookSignature(body, hmacHeader, webhookSecret)
    ) {
      const error: BillingApiError = {
        error: {
          code: "INVALID_WEBHOOK_SIGNATURE",
          message: "Webhook signature verification failed",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      const apiError: BillingApiError = {
        error: {
          code: "INVALID_WEBHOOK_PAYLOAD",
          message: "Invalid JSON in webhook payload",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(apiError, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Handle different webhook topics
    switch (topic) {
      case "app_subscriptions/update":
      case "app_subscriptions/create":
      case "app_subscriptions/cancel":
        console.log(
          `Received ${topic} webhook for shop: ${shopDomain}`,
          webhookData,
        );

        // For webhook handling, we just acknowledge receipt
        // The actual refresh will be triggered by the client
        return NextResponse.json(
          {
            success: true,
            message: "Webhook received successfully",
            topic,
            shopDomain,
          },
          { headers: corsHeaders },
        );

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
        return NextResponse.json(
          {
            success: true,
            message: "Webhook topic not handled",
            topic,
          },
          { headers: corsHeaders },
        );
    }
  } catch (error) {
    console.error("Error handling webhook:", error);

    const apiError: BillingApiError = {
      error: {
        code: "WEBHOOK_PROCESSING_ERROR",
        message: "Error processing webhook",
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

/**
 * Refresh subscription data from Shopify
 */
async function refreshSubscriptionData(
  request: NextRequest,
  requestData: SubscriptionRefreshRequest,
): Promise<NextResponse> {
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

    // Validate shop domain matches request
    if (requestData.shopDomain && requestData.shopDomain !== shop) {
      const error: BillingApiError = {
        error: {
          code: "SHOP_DOMAIN_MISMATCH",
          message:
            "Shop domain in request does not match authenticated session",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Create GraphQL client
    const shopifyInstance = shopify();
    const client = new shopifyInstance.clients.Graphql({ session });

    // Prepare GraphQL variables
    const variables: any = {};
    if (requestData.subscriptionId) {
      variables.subscriptionId = `gid://shopify/AppSubscription/${requestData.subscriptionId}`;
    }

    // Execute the subscription status query
    const response = await client.query({
      data: {
        query: GET_SUBSCRIPTION_STATUS_QUERY,
        variables,
      },
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

    // Process subscription data
    let refreshedSubscription: Subscription | null = null;

    // If specific subscription ID was requested, check the node query result first
    if (requestData.subscriptionId && data.data?.node) {
      const specificSubscription = data.data.node;
      if (specificSubscription && specificSubscription.id) {
        refreshedSubscription = transformSubscription(
          specificSubscription,
          shop,
        );
      }
    }

    // If no specific subscription found, get the first active subscription
    if (!refreshedSubscription) {
      const activeSubscriptions = appInstallation.activeSubscriptions || [];
      if (activeSubscriptions.length > 0) {
        refreshedSubscription = transformSubscription(
          activeSubscriptions[0],
          shop,
        );
      } else {
        // Check recent subscriptions if no active ones
        const allSubscriptions = appInstallation.allSubscriptions?.edges || [];
        if (allSubscriptions.length > 0) {
          refreshedSubscription = transformSubscription(
            allSubscriptions[0].node,
            shop,
          );
        }
      }
    }

    // Prepare response
    const refreshResponse: SubscriptionRefreshResponse = {
      success: true,
      subscription: refreshedSubscription || undefined,
    };

    return NextResponse.json(refreshResponse, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error refreshing subscription data:", error);

    // Handle specific error types
    let errorCode = "INTERNAL_ERROR";
    let errorMessage =
      "An unexpected error occurred while refreshing subscription data.";

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

    const refreshResponse: SubscriptionRefreshResponse = {
      success: false,
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
    };

    return NextResponse.json(refreshResponse, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle GET requests - refresh subscription data
 */
export async function GET(request: NextRequest) {
  // Check if this is a webhook request
  const topic = request.headers.get("x-shopify-topic");
  if (topic) {
    return handleWebhook(request);
  }

  // Handle regular refresh request
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shopDomain") || "";
  const subscriptionId = url.searchParams.get("subscriptionId") || undefined;

  const requestData: SubscriptionRefreshRequest = {
    shopDomain,
    subscriptionId,
  };

  return refreshSubscriptionData(request, requestData);
}

/**
 * Handle POST requests - refresh subscription data or webhook
 */
export async function POST(request: NextRequest) {
  // Check if this is a webhook request
  const topic = request.headers.get("x-shopify-topic");
  if (topic) {
    return handleWebhook(request);
  }

  // Handle regular refresh request
  try {
    const requestData: SubscriptionRefreshRequest = await request.json();
    return refreshSubscriptionData(request, requestData);
  } catch (error) {
    const apiError: BillingApiError = {
      error: {
        code: "INVALID_REQUEST_BODY",
        message: "Invalid JSON in request body",
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(apiError, {
      status: 400,
      headers: corsHeaders,
    });
  }
}
