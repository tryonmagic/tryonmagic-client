"use server";

import shopify from "@/lib/shopify/initialize-context";
import { handleSessionToken } from "@/lib/shopify/verify";

/**
 * Shopify subscription details from GraphQL API
 */
export interface ShopifySubscription {
  id: string;
  name: string;
  status: string;
  currentPeriodEnd?: string | null;
  createdAt?: string;
}

/**
 * Next.js Server Action to fetch current app subscription from Shopify
 * This directly queries Shopify's GraphQL Admin API from the server
 * Using latest Shopify API 2025-01 format
 */
export async function getCurrentShopifySubscription(
  sessionToken: string,
): Promise<{ shop: string; subscription: ShopifySubscription } | null> {
  "use server";

  try {
    const { session, shop } = await handleSessionToken(
      sessionToken,
      false,
      false,
    );

    if (!session || !session.accessToken) {
      console.error("No valid session found for shop:", shop);
      return null;
    }

    console.log("Session created, access token exists:", !!session.accessToken);

    // Create GraphQL client using the correct Shopify API method
    const GraphqlClient = shopify().clients.Graphql;
    const client = new GraphqlClient({ session });

    // GraphQL query based on Shopify's official 2025-01 documentation
    const query = `
      query GetRecurringApplicationCharges {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            currentPeriodEnd
            createdAt
          }
        }
      }
    `;

    // Execute GraphQL query using the correct method signature
    const response: any = await client.query({
      data: query,
    });

    console.log("Shopify GraphQL response:", JSON.stringify(response, null, 2));

    // Handle response structure
    const data = response.body || response.data || response;
    const activeSubscriptions =
      data?.data?.currentAppInstallation?.activeSubscriptions ||
      data?.currentAppInstallation?.activeSubscriptions;

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      console.log("No active subscriptions found for shop:", shop);
      return null;
    }

    console.log("Found active subscriptions:", activeSubscriptions.length);

    // Return the first active subscription
    return {
      subscription: activeSubscriptions[0] as ShopifySubscription,
      shop,
    };
  } catch (error) {
    console.error("Error fetching Shopify subscription:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null;
  }
}
