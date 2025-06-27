/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_HOST: process.env.HOST,
    NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },
  images: {
    domains: [
      "ig89yd5z8iykrgxva.lite.vusercontent.net",
      ...(process.env.NEXT_PUBLIC_S3_DOMAIN ? [process.env.NEXT_PUBLIC_S3_DOMAIN] : []),
    ],
    dangerouslyAllowSVG: true,
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
};

module.exports = nextConfig;
