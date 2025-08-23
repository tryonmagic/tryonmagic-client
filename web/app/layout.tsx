import Providers from "@/app/providers/providers";
import { Metadata } from "next";
import "./globals.css";
import { NavMenu } from "@/components/nav-menu";
import { Inter } from "next/font/google";
import { NavMenu as AppBridgeNavMenu } from "@shopify/app-bridge-react";

export const metadata: Metadata = {
  title: "Next.js Shopify App",
  other: {
    "shopify-api-key": process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
    "shopify-app-origins": process.env.NEXT_PUBLIC_HOST || "",
  },
};

// const inter = Inter({
//   subsets: ["latin"],
//   display: 'swap',
//   preload: false,
//   fallback: ['system-ui', 'arial'],
//   adjustFontFallback: false
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="shopify-api-key"
          content={process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID}
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      </head>
      <body>
        <Providers>
          {/* <NavMenu /> */}
          {children}
          <AppBridgeNavMenu>
            <a href="/" rel="home">
              ProdigyAI
            </a>
            <a href="/ai-model">AI Model</a>
            <a href="/ai-product">AI Product</a>
            <a href="/remove-bg">Remove BG</a>
            <a href="/upscale">Upscale</a>
            <a href="/relight">Relight</a>
            <a href="/expand-image">Expand Image</a>
            <a href="/magic-eraser">Magic Eraser</a>
            <a href="/purchase">Purchase (200 Points)</a>
          </AppBridgeNavMenu>
        </Providers>
      </body>
    </html>
  );
}
