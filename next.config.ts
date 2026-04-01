import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["mado.blue", "localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.bsky.app",
      },
      {
        protocol: "https",
        hostname: "*.bsky.network",
      },
    ],
  },
};

export default nextConfig;
