"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { ShopifySubscription } from "../billing/queries";

export type SubscriptionState = "loading" | "active" | "none" | "error";

interface SubscriptionContextType {
  subscriptionState: SubscriptionState;
  subscription: ShopifySubscription | null;
  shopDomain: string | null;
  hasCheckedSubscription: boolean;
  setSubscriptionState: (state: SubscriptionState) => void;
  setSubscription: (subscription: ShopifySubscription | null) => void;
  setShopDomain: (domain: string | null) => void;
  setHasCheckedSubscription: (checked: boolean) => void;
  redirectToBilling: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

const SUBSCRIPTION_CACHE_KEY = "tryonmagic.subscription.cache";

// Shopify managed billing URL for TryOnMagic
const SHOPIFY_BILLING_URL =
  "https://admin.shopify.com/charges/tryonmagic/pricing_plans";

type SubscriptionCache = {
  subscriptionState: SubscriptionState;
  subscription: ShopifySubscription | null;
  shopDomain: string | null;
  hasCheckedSubscription: boolean;
};

const getInitialCache = (): SubscriptionCache | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SubscriptionCache;
  } catch (error) {
    console.warn("Failed to read subscription cache:", error);
    return null;
  }
};

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialCache = getInitialCache();
  const [subscriptionState, setSubscriptionState] =
    useState<SubscriptionState>(initialCache?.subscriptionState ?? "loading");
  const [subscription, setSubscription] = useState<ShopifySubscription | null>(
    initialCache?.subscription ?? null,
  );
  const [shopDomain, setShopDomain] = useState<string | null>(
    initialCache?.shopDomain ?? null,
  );
  const [hasCheckedSubscription, setHasCheckedSubscription] =
    useState<boolean>(initialCache?.hasCheckedSubscription ?? false);

  const redirectToBilling = useCallback(() => {
    // Use window.open with _top to navigate out of the iframe
    window.open(SHOPIFY_BILLING_URL, "_top");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cache: SubscriptionCache = {
      subscriptionState,
      subscription,
      shopDomain,
      hasCheckedSubscription,
    };

    try {
      window.sessionStorage.setItem(
        SUBSCRIPTION_CACHE_KEY,
        JSON.stringify(cache),
      );
    } catch (error) {
      console.warn("Failed to write subscription cache:", error);
    }
  }, [subscriptionState, subscription, shopDomain, hasCheckedSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionState,
        subscription,
        shopDomain,
        hasCheckedSubscription,
        setSubscriptionState,
        setSubscription,
        setShopDomain,
        setHasCheckedSubscription,
        redirectToBilling,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}

export { SHOPIFY_BILLING_URL };
