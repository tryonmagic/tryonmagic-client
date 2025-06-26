/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone', // Enable standalone output for Docker
  env: {
    NEXT_PUBLIC_HOST: process.env.HOST,
  },
  images: {
    domains: [
      "ig89yd5z8iykrgxva.lite.vusercontent.net",
      process.env.NEXT_PUBLIC_S3_DOMAIN,
    ].filter(Boolean),
    dangerouslyAllowSVG: true,
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
};

module.exports = nextConfig;
