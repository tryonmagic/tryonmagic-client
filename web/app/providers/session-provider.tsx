"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import {
  authenticateShopifyApp,
  doWebhookRegistration,
  storeToken,
} from "../actions";
import { useRouter, usePathname } from "next/navigation"; // Import useRouter and usePathname

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const app = useAppBridge();
  const router = useRouter();
  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    app
      .idToken()
      .then((token) => {
        if (!token) {
          if (pathname !== "/") {
            router.push("/");
          }
          return;
        }
        console.log("Token", token);
        authenticateShopifyApp(token)
          .then((data) => {
            console.log("App authenticated", data);
          })
          .catch((error) => {
            console.error("Error storing token", error);
          });
        // doWebhookRegistration(token)
        //   .then(() => {
        //     console.log("Webhook registered");
        //   })
        //   .catch((error) => {
        //     console.error("Error registering webhook", error);
        //   });
      })
      .catch((error) => {
        console.error("Error fetching token", error);
        if (pathname !== "/") {
          router.push("/");
        }
      });
  }, [app, pathname, router]);

  return <>{children}</>;
}
