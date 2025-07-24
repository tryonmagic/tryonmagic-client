import { DeliveryMethod, Session } from "@shopify/shopify-api";
import { setupGDPRWebHooks } from "./gdpr";
import shopify from "./initialize-context";
import { AppInstallations } from "../db/app-installations";

let webhooksInitialized = false;

export function addHandlers() {
  if (!webhooksInitialized) {
    setupGDPRWebHooks("/api/webhooks");
    shopify().webhooks.addHandlers({
      ["APP_UNINSTALLED"]: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (_topic, shop, _body) => {
          console.log("Uninstalled app from shop: " + shop);
          await AppInstallations.delete(shop);
        },
      },
      ["APP_SUBSCRIPTIONS_UPDATE"]: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/billing/refresh-subscription",
        callback: async (topic, shop, body) => {
          console.log(`Subscription updated for shop: ${shop}`, {
            topic,
            body,
          });
          // The actual refresh logic is handled in the API endpoint
        },
      },
      ["APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT"]: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/billing/refresh-subscription",
        callback: async (topic, shop, body) => {
          console.log(`Subscription approaching cap for shop: ${shop}`, {
            topic,
            body,
          });
          // The actual refresh logic is handled in the API endpoint
        },
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
  const responses = await shopify().webhooks.register({ session });
  console.log("Webhooks added", responses);
}
