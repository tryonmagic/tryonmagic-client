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
import { useRouter, usePathname } from "next/navigation";
import { useSubscription } from "./subscription-context";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const app = useAppBridge();
  const router = useRouter();
  const pathname = usePathname();
  const checkAttempted = useRef(false);

  const {
    setSubscriptionState,
    setSubscription,
    setShopDomain,
  } = useSubscription();

  useEffect(() => {
    // Prevent multiple checks
    if (checkAttempted.current) {
      return;
    }

    const checkAndSyncSubscription = async (sessionToken: string) => {
      try {
        // Fetch current subscription from Shopify via server-side query
        const shopifySubscription =
          await getCurrentShopifySubscription(sessionToken);

        if (!shopifySubscription) {
          console.log("No active Shopify subscription found - requiring subscription");
          setSubscriptionState("none");
          setSubscription(null);
          return;
        }

        const subscription = shopifySubscription.subscription;
        
        // Check if subscription status is ACTIVE
        if (subscription.status.toUpperCase() !== "ACTIVE") {
          console.log("Subscription is not active:", subscription.status);
          setSubscriptionState("none");
          setSubscription(null);
          return;
        }

        // Subscription is active - set state
        console.log("Active subscription found:", subscription.name);
        setSubscription(subscription);
        setShopDomain(shopifySubscription.shop);
        setSubscriptionState("active");

        // Map Shopify status to internal status enum
        const statusMap: Record<string, SubscriptionStatus> = {
          ACTIVE: SubscriptionStatus.ACTIVE,
          CANCELLED: SubscriptionStatus.CANCELLED,
          PAUSED: SubscriptionStatus.PAUSED,
          EXPIRED: SubscriptionStatus.EXPIRED,
          PENDING: SubscriptionStatus.PENDING,
        };

        // Sync Shopify subscription with backend (non-blocking)
        syncSubscriptionWithBackend(sessionToken, {
          shopDomain: shopifySubscription.shop,
          subscriptionId: subscription.id,
          plan: getSubscriptionPlan(subscription.name),
          status:
            statusMap[subscription.status.toUpperCase()] ||
            SubscriptionStatus.ACTIVE,
          currentPeriodStart: subscription.createdAt,
          currentPeriodEnd: subscription.currentPeriodEnd || undefined,
          metadata: {
            source: "session_provider_sync",
            shopifySubscriptionId: subscription.id,
          },
        }).catch((error) => {
          console.error("Error syncing subscription with backend:", error);
          // Don't fail the whole flow if backend sync fails
        });
      } catch (error) {
        console.error("Error checking Shopify subscription:", error);
        setSubscriptionState("error");
      }
    };

    const initializeSession = async () => {
      checkAttempted.current = true;
      
      try {
        const token = await app.idToken();
        
        if (!token) {
          console.log("No session token available");
          if (pathname !== "/") {
            router.push("/");
          }
          setSubscriptionState("error");
          return;
        }

        console.log("Session token obtained");

        // Authenticate the app first
        try {
          await authenticateShopifyApp(token);
          console.log("App authenticated successfully");
        } catch (error) {
          console.error("Error authenticating app:", error);
          // Continue to check subscription even if auth fails
          // as the user might already be authenticated
        }

        // Check and sync subscription
        await checkAndSyncSubscription(token);
      } catch (error) {
        console.error("Error initializing session:", error);
        if (pathname !== "/") {
          router.push("/");
        }
        setSubscriptionState("error");
      }
    };

    initializeSession();
  }, [
    app,
    pathname,
    router,
    setSubscriptionState,
    setSubscription,
    setShopDomain,
  ]);

  return <>{children}</>;
}
