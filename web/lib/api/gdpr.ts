import type { GDPRDataRequest } from "@/lib/db/gdpr-models";

const API_BASE_URL = process.env.API_URL || "http://127.0.0.1:8000/v1";

/**
 * API client for GDPR operations
 * These will call a backend service that handles the database operations
 */
export const GDPRClient = {
  /**
   * Log a GDPR data request
   */
  async logRequest(
    request: Omit<GDPRDataRequest, "_id" | "createdAt" | "status">,
  ): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/gdpr/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to log GDPR request: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  },

  /**
   * Update GDPR request status
   */
  async updateRequestStatus(
    requestId: string,
    status: GDPRDataRequest["status"],
    notes?: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/gdpr/requests/${requestId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update GDPR request status: ${response.statusText}`,
      );
    }
  },

  /**
   * Get customer data for GDPR data request
   */
  async getCustomerData(shop: string, customerId: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/gdpr/customers/${customerId}?shop=${encodeURIComponent(shop)}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to get customer data: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Redact/delete customer data for GDPR compliance
   */
  async redactCustomerData(shop: string, customerId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/gdpr/customers/${customerId}/redact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shop }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to redact customer data: ${response.statusText}`);
    }
  },

  /**
   * Redact/delete shop data for GDPR compliance
   */
  async redactShopData(shop: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/gdpr/shops/${shop}/redact`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to redact shop data: ${response.statusText}`);
    }
  },

  /**
   * Clean up old GDPR request logs
   */
  async cleanupOldLogs(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/gdpr/cleanup`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to cleanup old GDPR logs: ${response.statusText}`,
      );
    }
  },
};
