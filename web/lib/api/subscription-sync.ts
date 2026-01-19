import { clientAPI } from "@/lib/api";
import { GenericAPIResponse } from "@/lib/api/type";
import { SubscriptionPlan } from "@/app/purchase/type";

/**
 * Subscription sync request payload
 * This is sent to the backend to keep subscription state in sync
 */
export interface SubscriptionSyncRequest {
  shopDomain: string;
  subscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  metadata?: Record<string, any>;
}

/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  PAUSED = "PAUSED",
  EXPIRED = "EXPIRED",
  PENDING = "PENDING",
}

/**
 * Subscription sync response from backend
 */
export interface SubscriptionSyncResponse {
  success: boolean;
  subscription?: {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    pointsBalance: number;
    monthlyPoints: number;
  };
  message?: string;
}

/**
 * Sync subscription data with backend
 * This should be called whenever subscription changes occur in Shopify
 */
export const syncSubscriptionWithBackend = async (
  token: string,
  syncData: SubscriptionSyncRequest,
): Promise<SubscriptionSyncResponse> => {
  try {
    const response = await clientAPI(token).post<
      GenericAPIResponse<SubscriptionSyncResponse>
    >("subscription/shopify/sync", syncData);

    return response.data.data || { success: false };
  } catch (error) {
    console.error("Error syncing subscription with backend:");
    throw error;
  }
};

/**
 * Get current subscription status from backend
 */
export const getSubscriptionStatus = async (
  token: string,
  shopDomain: string,
): Promise<SubscriptionSyncResponse> => {
  try {
    const response = await clientAPI(token).get<
      GenericAPIResponse<SubscriptionSyncResponse>
    >(`subscription/status?shopDomain=${shopDomain}`);

    return response.data.data || { success: false };
  } catch (error) {
    console.error("Error getting subscription status:");
    throw error;
  }
};
