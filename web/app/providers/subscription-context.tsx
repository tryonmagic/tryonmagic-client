"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ShopifySubscription } from "../billing/queries";

export type SubscriptionState = "loading" | "active" | "none" | "error";

interface SubscriptionContextType {
  subscriptionState: SubscriptionState;
  subscription: ShopifySubscription | null;
  shopDomain: string | null;
  setSubscriptionState: (state: SubscriptionState) => void;
  setSubscription: (subscription: ShopifySubscription | null) => void;
  setShopDomain: (domain: string | null) => void;
  redirectToBilling: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

// Shopify managed billing URL for TryOnMagic
const SHOPIFY_BILLING_URL =
  "https://admin.shopify.com/charges/tryonmagic/pricing_plans";

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscriptionState, setSubscriptionState] =
    useState<SubscriptionState>("loading");
  const [subscription, setSubscription] = useState<ShopifySubscription | null>(
    null,
  );
  const [shopDomain, setShopDomain] = useState<string | null>(null);

  const redirectToBilling = useCallback(() => {
    // Use window.open with _top to navigate out of the iframe
    window.open(SHOPIFY_BILLING_URL, "_top");
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionState,
        subscription,
        shopDomain,
        setSubscriptionState,
        setSubscription,
        setShopDomain,
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
