"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { getCurrentShopifySubscription } from "../billing/queries";
import {
  SubscriptionStatus,
  syncSubscriptionWithBackend,
} from "@/lib/api/subscription-sync";
import { getSubscriptionPlan } from "@/lib/utils";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const app = useAppBridge();

  // const router = useRouter();
  // const pathname = usePathname(); // Get the current path

  // Sync subscription with backend on page load
  // Fetch current subscription from Shopify via server-side query and sync with backend
  useEffect(() => {
    const syncSubscription = async () => {
      try {
        // Get session token for authentication
        const sessionToken = await app.idToken();

        // Fetch current subscription from Shopify via server-side query
        const shopifySubscription =
          await getCurrentShopifySubscription(sessionToken);
        console.log("Shopify subscription:", shopifySubscription);

        if (!shopifySubscription) {
          console.log("No active Shopify subscription found");
          return;
        }

        // Map Shopify status to internal status enum
        const statusMap: Record<string, SubscriptionStatus> = {
          ACTIVE: SubscriptionStatus.ACTIVE,
          CANCELLED: SubscriptionStatus.CANCELLED,
          PAUSED: SubscriptionStatus.PAUSED,
          EXPIRED: SubscriptionStatus.EXPIRED,
          PENDING: SubscriptionStatus.PENDING,
        };

        const token = await app.idToken();
        const subscription = shopifySubscription.subscription;

        // Sync Shopify subscription with backend
        await syncSubscriptionWithBackend(token, {
          shopDomain: shopifySubscription.shop,
          subscriptionId: subscription.id,
          plan: getSubscriptionPlan(subscription.name),
          status:
            statusMap[subscription.status.toUpperCase()] ||
            SubscriptionStatus.ACTIVE,
          currentPeriodStart: subscription.createdAt,
          currentPeriodEnd: subscription.currentPeriodEnd || undefined,
          metadata: {
            source: "billing_page_server_query",
            shopifySubscriptionId: subscription.id,
          },
        });
      } catch (error) {
        console.error("Error syncing Shopify subscription:", error);
        // Silently fail - don't block UI if sync fails
      }
    };

    syncSubscription();
  }, [app]);

  // useEffect(() => {
  //   app
  //     .idToken()
  //     .then((token) => {
  //       if (!token) {
  //         if (pathname !== "/") {
  //           router.push("/");
  //         }
  //         return;
  //       }
  //       console.log("Token", token);
  //       authenticateShopifyApp(token)
  //         .then((data) => {
  //           console.log("App authenticated");
  //         })
  //         .catch((error) => {
  //           console.error("Error storing token", error);
  //         });
  //       // doWebhookRegistration(token)
  //       //   .then(() => {
  //       //     console.log("Webhook registered");
  //       //   })
  //       //   .catch((error) => {
  //       //     console.error("Error registering webhook", error);
  //       //   });
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching token", error);
  //       if (pathname !== "/") {
  //         router.push("/");
  //       }
  //     });
  // }, [app, pathname, router]);

  return <>{children}</>;
}
