/**
 * Subscription data models and types for the billing page
 */

// Enums for subscription status and billing cycles
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  PENDING = "pending",
  EXPIRED = "expired",
  TRIAL = "trial",
}

export enum BillingCycle {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

// Core subscription data structure
export interface Subscription {
  id: string;
  shopDomain: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  createdAt: Date;
  updatedAt: Date;
  nextBillingDate: Date;
  cancelledAt?: Date;
  trialEndsAt?: Date;
  shopifySubscriptionId: string;
}

// Usage metrics for usage-based billing
export interface UsageMetrics {
  current: number;
  limit: number;
  unit: string;
}

// Available plan information for unsubscribed users
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  features: string[];
  isPopular?: boolean;
}

// API response type definitions
export interface SubscriptionStatusResponse {
  subscription: Subscription | null;
  usageMetrics?: UsageMetrics;
  availablePlans?: Plan[];
}

export interface ShopifyUrlsResponse {
  changePlanUrl: string;
  cancelPlanUrl: string;
  billingHistoryUrl: string;
  paymentMethodsUrl: string;
}

// Component prop interfaces
export interface SubscriptionData {
  id: string;
  planName: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  cancelledAt?: string;
  trialEndsAt?: string;
  usageMetrics?: UsageMetrics;
}

// Error handling types
export interface BillingError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface BillingApiError {
  error: BillingError;
  timestamp: string;
}

// Subscription refresh types
export interface SubscriptionRefreshRequest {
  shopDomain: string;
  subscriptionId?: string;
}

export interface SubscriptionRefreshResponse {
  success: boolean;
  subscription?: Subscription;
  error?: BillingError;
}
