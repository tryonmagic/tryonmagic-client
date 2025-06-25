import { DeliveryMethod } from "@shopify/shopify-api";
import getShopify from "./initialize-context";

/**
 * Shopify invokes this webhook.
 * https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks#customers-data_request
 */
export default function addGDPRWebhooks() {
  const shopify = getShopify();
  return shopify.webhooks.addHandlers({
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers-data-request",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers-redact",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/shop-redact",
    },
  });
}
