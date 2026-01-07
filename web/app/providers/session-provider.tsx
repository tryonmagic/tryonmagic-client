"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useRef } from "react";
import { getCurrentShopifySubscription } from "../billing/queries";
import {
  SubscriptionStatus,
  syncSubscriptionWithBackend,
} from "@/lib/api/subscription-sync";
import { getSubscriptionPlan } from "@/lib/utils";
import { authenticateShopifyApp } from "../actions";
import { useRouter, usePathname } from "next/navigation"; // Import useRouter and usePathname
import toast from "react-hot-toast";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const app = useAppBridge();

  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const redirectAttempted = useRef(false); // Track if we've already attempted redirect

  useEffect(() => {
    const syncSubscription = async () => {
      try {
        // Get session token for authentication
        const sessionToken = await app.idToken();

        // Fetch current subscription from Shopify via server-side query
        const shopifySubscription =
          await getCurrentShopifySubscription(sessionToken);

        if (!shopifySubscription) {
          toast.success("Redirecting to Shopify billing page...");
          // Only redirect once to avoid loops
          if (!redirectAttempted.current) {
            redirectAttempted.current = true;

            window.location.href =
              "https://admin.shopify.com/charges/tryonmagic/pricing_plans";
          }
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

    app
      .idToken()
      .then((token) => {
        if (!token) {
          if (pathname !== "/") {
            router.push("/");
          }
          return;
        }
        console.log("Token", token);
        authenticateShopifyApp(token)
          .then((data) => {
            console.log("App authenticated");
            syncSubscription();
          })
          .catch((error) => {
            console.error("Error storing token", error);
          });
        // doWebhookRegistration(token)
        //   .then(() => {
        //     console.log("Webhook registered");
        //   })
        //   .catch((error) => {
        //     console.error("Error registering webhook", error);
        //   });
      })
      .catch((error) => {
        console.error("Error fetching token", error);
        if (pathname !== "/") {
          router.push("/");
        }
      });
  }, [app, pathname, router]);

  return <>{children}</>;
}
