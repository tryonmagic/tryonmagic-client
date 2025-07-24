import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";
import { BillingApiError } from "@/app/billing/types";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-shopify-session-token",
};

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * GraphQL mutation to create a subscription
 */
const CREATE_SUBSCRIPTION_MUTATION = `
  mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
    appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems) {
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Plan configurations for subscription creation
 */
const PLAN_CONFIGS = {
  basic: {
    name: "Basic Plan",
    price: 9.99,
    currency: "USD",
    interval: "EVERY_30_DAYS",
  },
  pro: {
    name: "Pro Plan",
    price: 29.99,
    currency: "USD",
    interval: "EVERY_30_DAYS",
  },
  enterprise: {
    name: "Enterprise Plan",
    price: 99.99,
    currency: "USD",
    interval: "EVERY_30_DAYS",
  },
};

interface CreateSubscriptionRequest {
  planId: string;
  returnUrl?: string;
  generateDynamic?: boolean;
}

interface CreateSubscriptionResponse {
  subscriptionUrl: string;
  planName: string;
  planId: string;
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateSubscriptionRequest = await request.json();
    const { planId, returnUrl, generateDynamic = true } = body;

    if (!planId) {
      const error: BillingApiError = {
        error: {
          code: "MISSING_PLAN_ID",
          message: "Plan ID is required to create a subscription.",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate plan ID
    const planConfig = PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS];
    if (!planConfig) {
      const error: BillingApiError = {
        error: {
          code: "INVALID_PLAN_ID",
          message: `Invalid plan ID: ${planId}. Available plans: ${Object.keys(PLAN_CONFIGS).join(", ")}`,
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
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

    // Prepare return URL
    const finalReturnUrl = returnUrl || `https://${shop}/admin/apps`;

    // Create subscription using Shopify's billing API
    const response = await client.query({
      data: {
        query: CREATE_SUBSCRIPTION_MUTATION,
        variables: {
          name: planConfig.name,
          returnUrl: finalReturnUrl,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: {
                    amount: planConfig.price,
                    currencyCode: planConfig.currency,
                  },
                  interval: planConfig.interval,
                },
              },
            },
          ],
        },
      },
    });

    if (!response.body) {
      throw new Error("No response body from GraphQL mutation");
    }

    const data = response.body as any;

    if (data.errors && data.errors.length > 0) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(`GraphQL error: ${data.errors[0].message}`);
    }

    const subscriptionData = data.data?.appSubscriptionCreate;

    if (!subscriptionData) {
      throw new Error("No subscription data returned from GraphQL mutation");
    }

    // Check for user errors
    if (subscriptionData.userErrors && subscriptionData.userErrors.length > 0) {
      const userError = subscriptionData.userErrors[0];
      const error: BillingApiError = {
        error: {
          code: "SUBSCRIPTION_CREATION_ERROR",
          message: `Failed to create subscription: ${userError.message}`,
          details: {
            field: userError.field,
            userErrors: subscriptionData.userErrors,
          },
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get confirmation URL
    const confirmationUrl = subscriptionData.confirmationUrl;

    if (!confirmationUrl) {
      const error: BillingApiError = {
        error: {
          code: "MISSING_CONFIRMATION_URL",
          message: "No confirmation URL returned from Shopify.",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Prepare response
    const responseData: CreateSubscriptionResponse = {
      subscriptionUrl: confirmationUrl,
      planName: planConfig.name,
      planId: planId,
    };

    return NextResponse.json(responseData, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);

    // Handle specific error types
    let errorCode = "INTERNAL_ERROR";
    let errorMessage =
      "An unexpected error occurred while creating the subscription.";

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
