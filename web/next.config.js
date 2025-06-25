/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_HOST: process.env.HOST,
    NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },
  images: {
    domains: [
      "ig89yd5z8iykrgxva.lite.vusercontent.net",
      process.env.NEXT_PUBLIC_S3_DOMAIN,
      "tryonmagic.s3.ap-southeast-1.wasabisys.com",
    ].filter(Boolean),
    dangerouslyAllowSVG: true,
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
};

module.exports = nextConfig;
