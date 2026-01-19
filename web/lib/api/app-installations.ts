const API_BASE_URL = process.env.API_URL || "http://127.0.0.1:8000/v1";

/**
 * API client for app installation operations
 * These will call a backend service that handles the database operations
 */
export const AppInstallationsClient = {
  /**
   * Check if a shop is installed
   */
  async includes(shopDomain: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/installations/${encodeURIComponent(shopDomain)}`,
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.installed === true;
    } catch (error) {
      console.error("Error checking app installation:", error);
      return false;
    }
  },

  /**
   * Delete app installation for a shop
   */
  async delete(shopDomain: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/installations/${encodeURIComponent(shopDomain)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete app installation: ${response.statusText}`,
        );
      }

      const data = await response.json();

    } catch (error) {
      console.error("Error deleting app installation:");
      throw error;
    }
  },

  /**
   * Create app installation record
   */
  async create(shopDomain: string, installData: any): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/installations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop: shopDomain,
          ...installData,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create app installation: ${response.statusText}`,
        );
      }

      console.log(`App installed for shop:`);
    } catch (error) {
      console.error("Error creating app installation:");
      throw error;
    }
  },
};
