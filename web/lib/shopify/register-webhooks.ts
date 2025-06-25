import { DeliveryMethod, Session } from "@shopify/shopify-api";
import { serverSideAPI } from "../api";
import getShopify from "./initialize-context";
import { AppInstallations } from "../db/app-installations";

let webhooksInitialized = false;

export function addHandlers() {
  if (!webhooksInitialized) {
    getShopify().webhooks.addHandlers({
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/app-uninstalled",
      },
      PRODUCTS_CREATE: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/products-create",
      },
      PRODUCTS_UPDATE: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/products-update",
      },
      PRODUCTS_DELETE: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/products-delete",
      },
    });
    console.log("Added handlers");
    webhooksInitialized = true;
  } else {
    console.log("Handlers already added");
  }
}

export async function registerWebhooks(session: Session) {
  addHandlers();
  const shopify = getShopify();
  const responses = await shopify.webhooks.register({ session });
  console.log("Webhooks added", responses);
}
