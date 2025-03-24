import { Session } from "@prisma/client";
import { Session as ShopifySession } from "@shopify/shopify-api";
import prisma from "./prisma-connect";
import { serverSideAPI } from "../api";
const apiKey = process.env.SHOPIFY_API_KEY || "";

/**
 * Stores the session in the database
 * This could be usedful if we need to do something with the
 * access token later
 */
export async function storeSession(session: ShopifySession) {
  const data = await serverSideAPI.post("/auth/store-shopify-token", session);
  console.log({ data: data.data });
}

export async function loadSession(id: string) {
  const session = await prisma.session.findUnique({
    where: { id },
  });

  if (session) {
    return generateShopifySessionFromDB(session);
  } else {
    throw new SessionNotFoundError();
  }
}

export async function deleteSession(id: string) {
  await prisma.session.delete({
    where: { id },
  });
}

export async function deleteSessions(ids: string[]) {
  await prisma.session.deleteMany({
    where: { id: { in: ids } },
  });
}

export async function cleanUpSession(shop: string, accessToken: string) {
  await prisma.session.deleteMany({
    where: { shop, accessToken, apiKey },
  });
}

export async function findSessionsByShop(shop: string) {
  const sessions = await prisma.session.findMany({
    where: { shop, apiKey },
    include: {
      onlineAccessInfo: {
        include: {
          associatedUser: true,
        },
      },
    },
  });

  return sessions.map((session) => generateShopifySessionFromDB(session));
}

function generateShopifySessionFromDB(session: Session) {
  return new ShopifySession({
    id: session.id,
    shop: session.shop,
    accessToken: session.accessToken || undefined,
    scope: session.scope || undefined,
    state: session.state,
    isOnline: session.isOnline,
    expires: session.expires || undefined,
  });
}

export class SessionNotFoundError extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFoundError";
  }
}
