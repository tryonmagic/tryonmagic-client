import { NextRequest, NextResponse } from "next/server";
import shopify from "@/lib/shopify/initialize-context";
import { AppInstallations } from "@/lib/db/app-installations";
import {
  logGDPRRequest,
  updateGDPRRequestStatus,
  getCustomerData,
  redactCustomerData,
  redactShopData,
} from "@/lib/db/gdpr-models";
import crypto from "crypto";

/**
 * Verify the HMAC signature of the webhook request
 * This ensures the webhook is coming from Shopify
 */
function verifyWebhookHMAC(
  body: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader) {
    return false;
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

/**
 * Handle GDPR customers/data_request webhook
 * When a customer requests their data from a store owner
 */
async function handleCustomersDataRequest(
  shop: string,
  payload: any,
): Promise<void> {
  console.log("Processing customers/data_request webhook", {
    shop,
    customerId: payload.customer?.id,
    ordersRequested: payload.orders_requested,
    dataRequestId: payload.data_request?.id,
  });

  let requestId: string | undefined;

  try {
    // Log the GDPR request
    requestId = await logGDPRRequest({
      shop,
      customerId: payload.customer?.id?.toString(),
      customerEmail: payload.customer?.email,
      requestType: "data_request",
      payload,
    });

    // Gather customer data from the database
    const customerData = await getCustomerData(
      shop,
      payload.customer?.id?.toString(),
    );

    console.log("Customer data gathered:", {
      shop,
      customerId: payload.customer?.id,
      dataKeys: Object.keys(customerData.data),
    });

    // In a production environment, you should:
    // 1. Send this data to the merchant via email or make it downloadable
    // 2. Use a secure method to transfer the data
    // Example: await sendCustomerDataEmail(payload.customer.email, customerData);

    // Mark request as completed
    if (requestId) {
      await updateGDPRRequestStatus(
        requestId,
        "completed",
        "Customer data gathered and ready for merchant",
      );
    }
  } catch (error) {
    console.error("Error handling customers/data_request:", error);
    if (requestId) {
      await updateGDPRRequestStatus(
        requestId,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    throw error;
  }
}

/**
 * Handle GDPR customers/redact webhook
 * When a customer requests their data to be deleted
 */
async function handleCustomersRedact(
  shop: string,
  payload: any,
): Promise<void> {
  console.log("Processing customers/redact webhook", {
    shop,
    customerId: payload.customer?.id,
    ordersToRedact: payload.orders_to_redact,
  });

  let requestId: string | undefined;

  try {
    // Log the GDPR request
    requestId = await logGDPRRequest({
      shop,
      customerId: payload.customer?.id?.toString(),
      customerEmail: payload.customer?.email,
      requestType: "redact",
      payload,
    });

    // Redact customer data from the database
    await redactCustomerData(shop, payload.customer?.id?.toString());

    console.log("Customer data redaction completed:", {
      shop,
      customerId: payload.customer?.id,
    });

    // Mark request as completed
    if (requestId) {
      await updateGDPRRequestStatus(
        requestId,
        "completed",
        "Customer data redacted successfully",
      );
    }
  } catch (error) {
    console.error("Error handling customers/redact:", error);
    if (requestId) {
      await updateGDPRRequestStatus(
        requestId,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    throw error;
  }
}

/**
 * Handle GDPR shop/redact webhook
 * Sent 48 hours after a store owner uninstalls the app
 */
async function handleShopRedact(shop: string, payload: any): Promise<void> {
  console.log("Processing shop/redact webhook", {
    shop,
    shopId: payload.shop_id,
  });

  let requestId: string | undefined;

  try {
    // Log the GDPR request
    requestId = await logGDPRRequest({
      shop,
      requestType: "shop_redact",
      payload,
    });

    // Delete all shop data from your system
    await redactShopData(shop);

    console.log("Shop data redaction completed:", {
      shop_domain: payload.shop_domain,
      shop_id: payload.shop_id,
      timestamp: new Date().toISOString(),
    });

    // Mark request as completed
    if (requestId) {
      await updateGDPRRequestStatus(
        requestId,
        "completed",
        "Shop data redacted successfully",
      );
    }
  } catch (error) {
    console.error("Error handling shop/redact:", error);
    if (requestId) {
      await updateGDPRRequestStatus(
        requestId,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    throw error;
  }
}

/**
 * Handle APP_UNINSTALLED webhook
 * Triggered when a merchant uninstalls the app
 */
async function handleAppUninstalled(shop: string, payload: any): Promise<void> {
  console.log("Processing app/uninstalled webhook", { shop });

  try {
    // Clean up shop installation record
    await AppInstallations.delete(shop);

    console.log("App uninstalled cleanup completed:", {
      shop,
      timestamp: new Date().toISOString(),
    });

    // Note: shop/redact will be sent 48 hours later for GDPR compliance
    // This is just for immediate cleanup
  } catch (error) {
    console.error("Error handling app/uninstalled:", error);
    throw error;
  }
}

/**
 * Main webhook handler endpoint
 * Handles all webhook topics including mandatory GDPR webhooks
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the raw body for HMAC verification
    const rawBody = await req.text();

    // Get webhook headers
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const topicHeader = req.headers.get("x-shopify-topic");
    const shopHeader = req.headers.get("x-shopify-shop-domain");
    const apiVersion = req.headers.get("x-shopify-api-version");

    console.log("Received webhook:", {
      topic: topicHeader,
      shop: shopHeader,
      apiVersion,
    });

    // Verify the webhook HMAC
    const secret = process.env.SHOPIFY_API_SECRET || "";
    const isValid = verifyWebhookHMAC(rawBody, hmacHeader, secret);

    if (!isValid) {
      console.error("Invalid webhook HMAC signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    // Parse the webhook payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing webhook payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const shop = shopHeader || "";
    const topic = topicHeader?.toUpperCase().replace(/\//g, "_") || "";

    // Handle different webhook topics
    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST":
        await handleCustomersDataRequest(shop, payload);
        break;

      case "CUSTOMERS_REDACT":
        await handleCustomersRedact(shop, payload);
        break;

      case "SHOP_REDACT":
        await handleShopRedact(shop, payload);
        break;

      case "APP_UNINSTALLED":
        await handleAppUninstalled(shop, payload);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Still return 200 to prevent Shopify from retrying
    // Log the error for debugging
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}
