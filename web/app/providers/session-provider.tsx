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
    hasCheckedSubscription,
    setHasCheckedSubscription,
  } = useSubscription();

  useEffect(() => {
    const checkAndSyncSubscription = async (sessionToken: string) => {
      try {
        // Fetch current subscription from Shopify via server-side query
        const shopifySubscription =
          await getCurrentShopifySubscription(sessionToken);

        if (!shopifySubscription) {
          setSubscriptionState("none");
          setSubscription(null);
          setHasCheckedSubscription(true);
          return;
        }

        const subscription = shopifySubscription.subscription;

        // Check if subscription status is ACTIVE
        if (subscription.status.toUpperCase() !== "ACTIVE") {
          setSubscriptionState("none");
          setSubscription(null);
          setHasCheckedSubscription(true);
          return;
        }

        // Subscription is active - set state
        setSubscription(subscription);
        setShopDomain(shopifySubscription.shop);
        setSubscriptionState("active");
        setHasCheckedSubscription(true);

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
          console.error("Error syncing subscription with backend:");
          // Don't fail the whole flow if backend sync fails
        });
      } catch (error) {
        console.error("Error checking Shopify subscription:");
        setSubscriptionState("error");
        setHasCheckedSubscription(true);
      }
    };

    const initializeSession = async (sessionToken: string) => {
      checkAttempted.current = true;

      try {
        // Check and sync subscription
        await checkAndSyncSubscription(sessionToken);
      } catch (error) {
        console.error("Error initializing session:");
        if (pathname !== "/") {
          router.push("/");
        }
        setSubscriptionState("error");
        setHasCheckedSubscription(true);
      }
    };
    const checkToken = async () => {
      const token = await app.idToken();

      if (!token) {
        if (pathname !== "/") {
          router.push("/");
        }
        setSubscriptionState("error");
        setHasCheckedSubscription(true);
        // return;
      }

      try {
        await authenticateShopifyApp(token);
      } catch (error) {
        console.error("Error authenticating app:", error);
      }

      if (hasCheckedSubscription) {
        return;
      }

      // Prevent multiple checks
      if (checkAttempted.current) {
        return;
      }

      initializeSession(token);
    };
    checkToken();
  }, [
    app,
    hasCheckedSubscription,
    pathname,
    router,
    setSubscriptionState,
    setSubscription,
    setShopDomain,
    setHasCheckedSubscription,
  ]);

  return <>{children}</>;
}
