"use server";
import { serverSideAPI } from "@/lib/api";
import { GenericAPIResponse } from "@/lib/api/type";
import { registerWebhooks } from "@/lib/shopify/register-webhooks";
import { handleSessionToken } from "@/lib/shopify/verify";

/**
 * Do the server action and return the status
 */
export async function doServerAction(sessionIdToken: string): Promise<{
  status: "success" | "error";
  data?: {
    shop: string;
  };
}> {
  try {
    const {
      session: { shop },
    } = await handleSessionToken(sessionIdToken);

    return {
      status: "success",
      data: {
        shop,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
    };
  }
}

/**
 * Store the session (and access token) in the database
 */
export async function storeToken(sessionToken: string) {
  await handleSessionToken(sessionToken, true, true);
}

/**
 * Register the webooks that we want setup.
 */
export async function doWebhookRegistration(sessionToken: string) {
  const { session } = await handleSessionToken(sessionToken);
  await registerWebhooks(session);
}

export async function authenticateShopifyApp(sessionToken: string) {
  const response = await serverSideAPI.post<GenericAPIResponse>(
    "/auth/shopify-auth",
    { sessionToken },
  );
  return response.data;
}
