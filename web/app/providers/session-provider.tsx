"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { doWebhookRegistration, storeToken } from "../actions";
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
        storeToken(token)
          .then(() => {
            console.log("Token stored");
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
  }, [app]);

  return <>{children}</>;
}
