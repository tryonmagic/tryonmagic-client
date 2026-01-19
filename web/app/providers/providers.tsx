"use client";

import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import SessionProvider from "./session-provider";
import { TanstackProvider } from "./tanstack-provider";
import { SubscriptionProvider } from "./subscription-context";
import { SubscriptionGate } from "./subscription-gate";

import { ThemeProvider } from "@/app/providers/theme-provider";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={translations}>
      <SubscriptionProvider>
        <SessionProvider>
          <SubscriptionGate>
            <TanstackProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </TanstackProvider>
          </SubscriptionGate>
        </SessionProvider>
      </SubscriptionProvider>
    </AppProvider>
  );
}

export function ExitProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider i18n={translations}>{children}</AppProvider>;
}
