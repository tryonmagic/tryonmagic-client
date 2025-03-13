"use client";

import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import SessionProvider from "./session-provider";
import { TanstackProvider } from "./tanstack-provider";
import { Outlet } from "@remix-run/react";
import { NavMenu } from "@shopify/app-bridge-react";
import Link from "next/link";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={translations}>
      <TanstackProvider>
        <NavMenu>
          <Link href="/app" rel="home">
            ProdigyAI
          </Link>
          <Link href="/app/ai-model">AI Model</Link>
          <Link href="/ai-product">AI Product</Link>
          <Link href="/remove-bg">Remove BG</Link>
          <Link href="/upscale">Upscale</Link>
          <Link href="/relight">Relight</Link>
          <Link href="/expand-image">Expand Image</Link>
          <Link href="/magic-eraser">Magic Eraser</Link>
          <Link href="/purchase">Purchase (200 Points)</Link>
        </NavMenu>
        <SessionProvider>{children}</SessionProvider>
      </TanstackProvider>
    </AppProvider>
  );
}

export function ExitProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider i18n={translations}>{children}</AppProvider>;
}
