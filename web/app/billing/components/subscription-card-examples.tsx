"use client";

import React from "react";
import { Layout } from "@shopify/polaris";
import { SubscriptionCard } from "./subscription-card";
import { SubscriptionStatus, BillingCycle, SubscriptionData } from "../types";

// Example subscription data for different states
const activeSubscription: SubscriptionData = {
  id: "sub_active",
  planName: "Professional Plan",
  status: SubscriptionStatus.ACTIVE,
  price: 29.99,
  currency: "USD",
  billingCycle: BillingCycle.MONTHLY,
  nextBillingDate: "2025-08-22",
};

const cancelledSubscription: SubscriptionData = {
  id: "sub_cancelled",
  planName: "Basic Plan",
  status: SubscriptionStatus.CANCELLED,
  price: 19.99,
  currency: "USD",
  billingCycle: BillingCycle.MONTHLY,
  nextBillingDate: "2025-08-15",
  cancelledAt: "2025-07-20",
};

const trialSubscription: SubscriptionData = {
  id: "sub_trial",
  planName: "Premium Plan",
  status: SubscriptionStatus.TRIAL,
  price: 49.99,
  currency: "USD",
  billingCycle: BillingCycle.YEARLY,
  nextBillingDate: "2025-08-30",
  trialEndsAt: "2025-08-01",
};

const expiredSubscription: SubscriptionData = {
  id: "sub_expired",
  planName: "Starter Plan",
  status: SubscriptionStatus.EXPIRED,
  price: 9.99,
  currency: "USD",
  billingCycle: BillingCycle.MONTHLY,
  nextBillingDate: "2025-07-15",
};

const pendingSubscription: SubscriptionData = {
  id: "sub_pending",
  planName: "Enterprise Plan",
  status: SubscriptionStatus.PENDING,
  price: 99.99,
  currency: "USD",
  billingCycle: BillingCycle.YEARLY,
  nextBillingDate: "2025-08-25",
};

/**
 * Example component demonstrating SubscriptionCard with different subscription states
 * This can be used for testing and development purposes
 */
export function SubscriptionCardExamples() {
  return (
    <Layout>
      <Layout.Section>
        <h2>Active Subscription</h2>
        <SubscriptionCard subscription={activeSubscription} />
      </Layout.Section>

      <Layout.Section>
        <h2>Cancelled Subscription</h2>
        <SubscriptionCard subscription={cancelledSubscription} />
      </Layout.Section>

      <Layout.Section>
        <h2>Trial Subscription</h2>
        <SubscriptionCard subscription={trialSubscription} />
      </Layout.Section>

      <Layout.Section>
        <h2>Expired Subscription</h2>
        <SubscriptionCard subscription={expiredSubscription} />
      </Layout.Section>

      <Layout.Section>
        <h2>Pending Subscription</h2>
        <SubscriptionCard subscription={pendingSubscription} />
      </Layout.Section>
    </Layout>
  );
}
