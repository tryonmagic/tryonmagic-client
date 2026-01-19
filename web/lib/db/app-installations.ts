import { AppInstallationsClient } from "@/lib/api/app-installations";

/**
 * App Installations wrapper
 * This now uses API calls to a backend service instead of direct MongoDB access
 */
export const AppInstallations = {
  includes: async function (shopDomain: string): Promise<boolean> {
    try {
      return await AppInstallationsClient.includes(shopDomain);
    } catch (error) {
      console.error("Error checking app installation:");
      return false;
    }
  },

  delete: async function (shopDomain: string): Promise<void> {
    try {
      await AppInstallationsClient.delete(shopDomain);
    } catch (error) {
      console.error("Error deleting app installation:");
      throw error;
    }
  },

  create: async function (shopDomain: string, installData: any): Promise<void> {
    try {
      await AppInstallationsClient.create(shopDomain, installData);
    } catch (error) {
      console.error("Error creating app installation:");
      throw error;
    }
  },
};
