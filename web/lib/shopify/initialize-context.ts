import "@shopify/shopify-api/adapters/web-api";
import {
  shopifyApi,
  LATEST_API_VERSION,
  LogSeverity,
} from "@shopify/shopify-api";

console.log(process.env.SCOPES?.split(","));

// Lazy initialization to prevent build-time issues with placeholder values
let shopifyInstance: ReturnType<typeof shopifyApi> | null = null;

function createShopifyInstance() {
  if (shopifyInstance) return shopifyInstance;
  
  // Skip validation during build time
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a dummy instance for build time
    shopifyInstance = shopifyApi({
      apiKey: "dummy",
      apiSecretKey: "dummy",
      scopes: ["write_products"],
      hostName: "dummy.myshopify.com",
      hostScheme: "https",
      isEmbeddedApp: true,
      apiVersion: LATEST_API_VERSION,
      logger: {
        level: LogSeverity.Error,
      },
    });
    return shopifyInstance;
  }
  
  // Validate that we have real values (not placeholders) at runtime
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  
  if (!apiKey || apiKey === "placeholder_api_key" || !apiSecretKey || apiSecretKey === "placeholder_secret") {
    throw new Error("Shopify API credentials not properly configured");
  }
  
  shopifyInstance = shopifyApi({
    apiKey: apiKey,
    apiSecretKey: apiSecretKey,
    scopes: process.env.SCOPES?.split(",") || ["write_products"],
    hostName: process.env.HOST?.replace(/https?:\/\//, "") || "",
    hostScheme: "https",
    isEmbeddedApp: true,
    apiVersion: LATEST_API_VERSION,
    logger: {
      level:
        process.env.NODE_ENV === "development"
          ? LogSeverity.Debug
          : LogSeverity.Error,
    },
  });
  
  return shopifyInstance;
}

// Export a getter function instead of the instance directly
export default function getShopify() {
  return createShopifyInstance();
}
