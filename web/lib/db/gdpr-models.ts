import { GDPRClient } from "@/lib/api/gdpr";

/**
 * GDPR Data Request Log
 * Tracks all data requests for compliance
 */
export interface GDPRDataRequest {
  _id?: string;
  shop: string;
  customerId?: string;
  customerEmail?: string;
  requestType: "data_request" | "redact" | "shop_redact";
  payload: any;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  processedAt?: Date;
  notes?: string;
}

/**
 * Log a GDPR data request
 * This function now calls the backend API instead of directly accessing MongoDB
 */
export async function logGDPRRequest(
  request: Omit<GDPRDataRequest, "_id" | "createdAt" | "status">,
): Promise<string> {
  try {
    return await GDPRClient.logRequest(request);
  } catch (error) {
    console.error("Error logging GDPR request:", error);
    throw error;
  }
}

/**
 * Update GDPR request status
 * This function now calls the backend API instead of directly accessing MongoDB
 */
export async function updateGDPRRequestStatus(
  requestId: string,
  status: GDPRDataRequest["status"],
  notes?: string,
): Promise<void> {
  try {
    await GDPRClient.updateRequestStatus(requestId, status, notes);
  } catch (error) {
    console.error("Error updating GDPR request status:", error);
    throw error;
  }
}

/**
 * Get customer data for GDPR data request
 * This should gather all data you have stored for a customer
 * This function now calls the backend API instead of directly accessing MongoDB
 */
export async function getCustomerData(
  shop: string,
  customerId: string,
): Promise<any> {
  try {
    return await GDPRClient.getCustomerData(shop, customerId);
  } catch (error) {
    console.error("Error gathering customer data:", error);
    throw error;
  }
}

/**
 * Redact/delete customer data for GDPR compliance
 * This function now calls the backend API instead of directly accessing MongoDB
 */
export async function redactCustomerData(
  shop: string,
  customerId: string,
): Promise<void> {
  try {
    await GDPRClient.redactCustomerData(shop, customerId);
  } catch (error) {
    console.error("Error redacting customer data:", error);
    throw error;
  }
}

/**
 * Redact/delete shop data for GDPR compliance
 * Called 48 hours after app uninstall
 * This function now calls the backend API instead of directly accessing MongoDB
 */
export async function redactShopData(shop: string): Promise<void> {
  try {
    await GDPRClient.redactShopData(shop);
  } catch (error) {
    console.error("Error redacting shop data:", error);
    throw error;
  }
}

/**
 * Clean up old GDPR request logs (optional - for housekeeping)
 * Keep logs for 2 years as proof of compliance
 * This function now calls the backend API instead of directly accessing MongoDB
 */
export async function cleanupOldGDPRLogs(): Promise<void> {
  try {
    await GDPRClient.cleanupOldLogs();
  } catch (error) {
    console.error("Error cleaning up old GDPR logs:", error);
    throw error;
  }
}
