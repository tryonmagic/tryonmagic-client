import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";
import { ShopifyUrlsResponse, BillingApiError } from "@/app/billing/types";

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
 * GraphQL mutation to create a subscription for plan changes
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
 * GraphQL mutation to create a one-time purchase for cancellation
 */
const CREATE_ONE_TIME_PURCHASE_MUTATION = `
  mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!) {
    appPurchaseOneTimeCreate(name: $name, price: $price, returnUrl: $returnUrl) {
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Generate Shopify billing URLs for plan management
 */
function generateShopifyUrls(
  shop: string,
  appHandle?: string | null,
): ShopifyUrlsResponse {
  // Extract shop handle from domain (e.g., "cool-shop" from "cool-shop.myshopify.com")
  const shopHandle = shop.replace(".myshopify.com", "");

  // Base URLs for Shopify admin billing sections
  const baseAdminUrl = `https://admin.shopify.com/store/${shopHandle}`;

  // Generate URLs based on Shopify's URL patterns
  const urls: ShopifyUrlsResponse = {
    // For plan changes, we'll need to create a subscription with confirmationUrl
    changePlanUrl: appHandle
      ? `${baseAdminUrl}/charges/${appHandle}/pricing_plans`
      : `${baseAdminUrl}/settings/billing`,

    // For cancellation, we'll need to create a cancellation flow
    cancelPlanUrl: appHandle
      ? `${baseAdminUrl}/charges/${appHandle}/pricing_plans`
      : `${baseAdminUrl}/settings/billing`,

    // Direct links to Shopify billing sections
    billingHistoryUrl: `${baseAdminUrl}/settings/billing`,
    paymentMethodsUrl: `${baseAdminUrl}/settings/billing`,
  };

  return urls;
}

/**
 * Create a temporary subscription to get confirmation URL for plan changes
 */
async function createPlanChangeUrl(
  client: any,
  returnUrl: string,
): Promise<string | null> {
  try {
    const response = await client.query({
      data: {
        query: CREATE_SUBSCRIPTION_MUTATION,
        variables: {
          name: "Plan Change",
          returnUrl,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: 0, currencyCode: "USD" },
                },
              },
            },
          ],
        },
      },
    });

    const data = response.body?.data?.appSubscriptionCreate;
    if (data?.confirmationUrl) {
      return data.confirmationUrl;
    }

    return null;
  } catch (error) {
    console.error("Error creating plan change URL:", error);
    return null;
  }
}

/**
 * Create a temporary one-time purchase to get confirmation URL for cancellation
 */
async function createCancellationUrl(
  client: any,
  returnUrl: string,
): Promise<string | null> {
  try {
    const response = await client.query({
      data: {
        query: CREATE_ONE_TIME_PURCHASE_MUTATION,
        variables: {
          name: "Plan Cancellation",
          price: { amount: 0, currencyCode: "USD" },
          returnUrl,
        },
      },
    });

    const data = response.body?.data?.appPurchaseOneTimeCreate;
    if (data?.confirmationUrl) {
      return data.confirmationUrl;
    }

    return null;
  } catch (error) {
    console.error("Error creating cancellation URL:", error);
    return null;
  }
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

    // Validate shop domain format
    if (!shop.includes(".myshopify.com")) {
      const error: BillingApiError = {
        error: {
          code: "INVALID_SHOP_DOMAIN",
          message:
            "Invalid shop domain format. Expected format: shop.myshopify.com",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get optional parameters
    const url = new URL(request.url);
    const returnUrl =
      url.searchParams.get("returnUrl") || `https://${shop}/admin/apps`;
    const appHandle = url.searchParams.get("appHandle");
    const generateDynamic = url.searchParams.get("dynamic") === "true";

    // Create GraphQL client for dynamic URL generation
    let dynamicUrls: Partial<ShopifyUrlsResponse> = {};

    if (generateDynamic) {
      try {
        const shopifyInstance = shopify();
        const client = new shopifyInstance.clients.Graphql({ session });

        // Generate dynamic URLs using Shopify's billing API
        const [changePlanUrl, cancelPlanUrl] = await Promise.all([
          createPlanChangeUrl(client, returnUrl),
          createCancellationUrl(client, returnUrl),
        ]);

        if (changePlanUrl) {
          dynamicUrls.changePlanUrl = changePlanUrl;
        }
        if (cancelPlanUrl) {
          dynamicUrls.cancelPlanUrl = cancelPlanUrl;
        }
      } catch (error) {
        console.warn(
          "Failed to generate dynamic URLs, falling back to static URLs:",
          error,
        );
      }
    }

    // Generate base URLs
    const baseUrls = generateShopifyUrls(shop, appHandle);

    // Merge dynamic URLs with base URLs (dynamic takes precedence)
    const finalUrls: ShopifyUrlsResponse = {
      ...baseUrls,
      ...dynamicUrls,
    };

    return NextResponse.json(finalUrls, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error generating Shopify URLs:", error);

    // Handle specific error types
    let errorCode = "INTERNAL_ERROR";
    let errorMessage =
      "An unexpected error occurred while generating Shopify URLs.";

    if (error instanceof Error) {
      if (error.message.includes("Session not found")) {
        errorCode = "SESSION_NOT_FOUND";
        errorMessage = "Session not found or expired. Please re-authenticate.";
      } else if (error.message.includes("Invalid session")) {
        errorCode = "INVALID_SESSION";
        errorMessage = "Invalid session token. Please re-authenticate.";
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
    const body = await request.json();
    const { returnUrl, appHandle, generateDynamic = false } = body;

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

    // Validate shop domain format
    if (!shop.includes(".myshopify.com")) {
      const error: BillingApiError = {
        error: {
          code: "INVALID_SHOP_DOMAIN",
          message:
            "Invalid shop domain format. Expected format: shop.myshopify.com",
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(error, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Create GraphQL client for dynamic URL generation
    let dynamicUrls: Partial<ShopifyUrlsResponse> = {};

    if (generateDynamic) {
      try {
        const shopifyInstance = shopify();
        const client = new shopifyInstance.clients.Graphql({ session });

        const finalReturnUrl = returnUrl || `https://${shop}/admin/apps`;

        // Generate dynamic URLs using Shopify's billing API
        const [changePlanUrl, cancelPlanUrl] = await Promise.all([
          createPlanChangeUrl(client, finalReturnUrl),
          createCancellationUrl(client, finalReturnUrl),
        ]);

        if (changePlanUrl) {
          dynamicUrls.changePlanUrl = changePlanUrl;
        }
        if (cancelPlanUrl) {
          dynamicUrls.cancelPlanUrl = cancelPlanUrl;
        }
      } catch (error) {
        console.warn(
          "Failed to generate dynamic URLs, falling back to static URLs:",
          error,
        );
      }
    }

    // Generate base URLs
    const baseUrls = generateShopifyUrls(shop, appHandle);

    // Merge dynamic URLs with base URLs (dynamic takes precedence)
    const finalUrls: ShopifyUrlsResponse = {
      ...baseUrls,
      ...dynamicUrls,
    };

    return NextResponse.json(finalUrls, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error generating Shopify URLs:", error);

    // Handle specific error types
    let errorCode = "INTERNAL_ERROR";
    let errorMessage =
      "An unexpected error occurred while generating Shopify URLs.";

    if (error instanceof Error) {
      if (error.message.includes("Session not found")) {
        errorCode = "SESSION_NOT_FOUND";
        errorMessage = "Session not found or expired. Please re-authenticate.";
      } else if (error.message.includes("Invalid session")) {
        errorCode = "INVALID_SESSION";
        errorMessage = "Invalid session token. Please re-authenticate.";
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
