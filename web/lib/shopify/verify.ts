import getShopify from "@/lib/shopify/initialize-context";
import { RequestedTokenType, Session } from "@shopify/shopify-api";
import { NextRequest } from "next/server";
import { loadSession, storeSession } from "../db/session-storage";

export class AppNotInstalledError extends Error {
  constructor() {
    super("App not installed");
    this.name = "AppNotInstalledError";
  }
}

export class SessionNotFoundError extends Error {
  isOnline: boolean;
  constructor(isOnline: boolean) {
    super("Session not found");
    this.name = "SessionNotFoundError";
    this.isOnline = isOnline;
  }
}

export class ScopeMismatchError extends Error {
  isOnline: boolean;
  accountOwner: boolean;
  constructor(isOnline: boolean, accountOwner: boolean) {
    super("Scope mismatch");
    this.name = "ScopeMismatchError";
    this.isOnline = isOnline;
    this.accountOwner = accountOwner;
  }
}

export class ExpiredTokenError extends Error {
  isOnline: boolean;
  constructor(isOnline: boolean) {
    super(`Token expired - ${isOnline ? "online" : "offline"}`);
    this.name = "ExpiredTokenError";
    this.isOnline = isOnline;
  }
}

export async function verifyRequest(
  req: NextRequest,
  isOnline: boolean = false,
): Promise<{ shop: string; session: Session }> {
  const shopify = getShopify();
  const sessionId = await shopify.session.getCurrentId({
    isOnline,
    rawRequest: req,
  });

  if (!sessionId) {
    throw new Error("No session found");
  }

  const session = await loadSession(sessionId);

  if (!session) {
    throw new Error("No session found");
  }

  return { shop: session.shop, session };
}

/**
 * Do the token exchange from the sessionIdToken that comes from the client
 * This returns a valid session object.
 * Optionally store the session in the database. Sometimes, if you are focused on speed,
 * you don't want to always store the session in the database.
 */
export async function tokenExchange({
  shop,
  sessionToken,
  online,
  store,
}: {
  shop: string;
  sessionToken: string;
  online?: boolean;
  store?: boolean;
}): Promise<Session> {
  const shopify = getShopify();
  const response = await shopify.auth.tokenExchange({
    shop,
    sessionToken,
    requestedTokenType: online
      ? RequestedTokenType.OnlineAccessToken
      : RequestedTokenType.OfflineAccessToken,
  });
  const { session } = response;
  if (store) {
    await storeSession(session);
  }
  return session;
}

/**
 * @description Do all the necessary steps, to validate the session token and refresh it if it needs to.
 * @param sessionToken The session token from the request headers or directly sent by the client
 * @param online
 * @returns The session object
 */
export async function handleSessionToken(
  sessionToken: string,
  online?: boolean,
  store?: boolean,
): Promise<{ shop: string; session: Session }> {
  const shopify = getShopify();
  const payload = await shopify.session.decodeSessionToken(sessionToken);
  const shop = payload.dest.replace("https://", "");
  const session = await tokenExchange({ shop, sessionToken, online, store });
  return { shop, session };
}
