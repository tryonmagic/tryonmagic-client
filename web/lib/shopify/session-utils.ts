import { Session } from "@shopify/shopify-api";

export interface SessionInfo {
  shop: string;
  accessToken: string;
  sessionId: string;
  isOnline: boolean;
  expires?: Date;
  scope?: string;
}

/**
 * Get session token from App Bridge
 * This is the proper way to get session tokens in Shopify embedded apps
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    // In a Shopify embedded app, we need to get the token from App Bridge
    // This should be called from a component that has access to the App Bridge context
    if (typeof window !== "undefined") {
      // Check if we're in a Shopify embedded app context
      const appBridge = (window as any).shopify?.config;
      if (appBridge) {
        // The token should be available through App Bridge
        // For now, we'll return null and let the component handle token retrieval
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting session token:", error);
    return null;
  }
}

/**
 * Store session token in localStorage (for backward compatibility)
 */
export function storeSessionToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("sessionToken", token);
  }
}

/**
 * Remove session token from localStorage
 */
export function clearSessionToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sessionToken");
  }
}

/**
 * Verify session with the API and return session info
 */
export async function verifySession(
  sessionToken: string,
): Promise<SessionInfo> {
  const response = await fetch("/api/auth/verify", {
    headers: {
      "x-shopify-session-token": sessionToken,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to verify session");
  }

  const data = await response.json();
  return {
    shop: data.shop,
    accessToken: data.accessToken,
    sessionId: data.sessionId,
    isOnline: data.isOnline,
    expires: data.expires ? new Date(data.expires) : undefined,
    scope: data.scope,
  };
}

/**
 * Check if a session is valid and not expired
 */
export function isSessionValid(session: SessionInfo): boolean {
  if (!session.accessToken || !session.shop) {
    return false;
  }

  // Check if session has expired
  if (session.expires && new Date() > session.expires) {
    return false;
  }

  return true;
}

/**
 * Get session info with automatic token retrieval and verification
 * This function should be called with a valid session token from App Bridge
 */
export async function getSessionInfo(
  sessionToken?: string,
): Promise<SessionInfo | null> {
  try {
    // If no token provided, try to get one (this will likely fail in embedded app context)
    const token = sessionToken || (await getSessionToken());

    if (!token) {
      return null;
    }

    const sessionInfo = await verifySession(token);

    if (!isSessionValid(sessionInfo)) {
      clearSessionToken();
      return null;
    }

    return sessionInfo;
  } catch (error) {
    console.error("Error getting session info:", error);
    clearSessionToken();
    return null;
  }
}

/**
 * Create headers for authenticated API requests
 */
export function createAuthHeaders(
  sessionToken: string,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-shopify-session-token": sessionToken,
  };
}

/**
 * Handle session errors and redirect to auth if needed
 */
export function handleSessionError(error: Error): void {
  console.error("Session error:", error);

  // Clear invalid session
  clearSessionToken();

  // Redirect to auth or show error message
  if (typeof window !== "undefined") {
    // You can customize this based on your app's auth flow
    window.location.href = "/auth";
  }
}

/**
 * Hook to get session token from App Bridge
 * This should be used in components that need session tokens
 */
export function useSessionToken(): string | null {
  // This is a placeholder - in a real implementation, you would use App Bridge hooks
  // For now, we'll return null and let components handle token retrieval
  return null;
}
