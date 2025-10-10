import Providers from "@/app/providers/providers";
import { Metadata } from "next";
import "./globals.css";
import { NavMenu as AppBridgeNavMenu } from "@shopify/app-bridge-react";
import { ImagePreview } from "@/components/ui/ImagePreview";

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
          {children}
          <AppBridgeNavMenu>
            <a href="/" rel="home">
              TryOnMagic
            </a>
            <a href="/ai-model">AI Model</a>
            <a href="/virtual-try-on">Virtual Try-On</a>
            <a href="/ai-product">AI Product</a>
            <a href="/smart-background">Smart Background</a>
            <a href="/upscale-image">Upscale Image</a>
            <a href="/expand-image">Expand Image</a>
            <a href="/magic-eraser">Magic Eraser</a>
            <a href="/usage">View Usage</a>
            <a href="/purchase">Purchase (Free 20 Points)</a>
          </AppBridgeNavMenu>
          <ImagePreview />
        </Providers>
      </body>
    </html>
  );
}
