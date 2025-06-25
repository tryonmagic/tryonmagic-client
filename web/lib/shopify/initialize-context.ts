import "@shopify/shopify-api/adapters/web-api";
import {
  shopifyApi,
  LATEST_API_VERSION,
  LogSeverity,
} from "@shopify/shopify-api";

// Check if we have the required environment variables
const hasRequiredEnvVars = !!(
  process.env.SHOPIFY_API_KEY &&
  process.env.SHOPIFY_API_SECRET &&
  process.env.HOST
);

let shopify: ReturnType<typeof shopifyApi> | null = null;

if (hasRequiredEnvVars) {
  console.log(process.env.SCOPES?.split(","));
  shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes: process.env.SCOPES?.split(",") || ["write_products"],
    hostName: process.env.HOST!.replace(/https?:\/\//, ""),
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
} else {
  console.warn("Shopify API initialization skipped due to missing environment variables");
}

export default shopify;
