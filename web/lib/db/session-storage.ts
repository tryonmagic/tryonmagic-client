import { Session as ShopifySession } from "@shopify/shopify-api";
import { serverSideAPI } from "../api";
const apiKey = process.env.SHOPIFY_API_KEY || "";

/**
 * Stores the session in the database
 * This could be usedful if we need to do something with the
 * access token later
 */
export async function storeSession(session: ShopifySession) {
  const data = await serverSideAPI.post("/auth/store-shopify-token", session);
}
