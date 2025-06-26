/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone', // Temporarily disabled to fix dependency issues
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
  // Ensure proper cache handling for static assets
  generateBuildId: async () => {
    // Use timestamp to ensure unique build IDs for each deployment
    return `build-${Date.now()}`;
  },
  // Add headers for better cache control
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
