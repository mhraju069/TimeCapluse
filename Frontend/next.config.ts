import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hecticly-rural-kittie.ngrok-free.dev',
      },
    ],
  },
  allowedDevOrigins: [
    'hecticly-rural-kittie.ngrok-free.dev',
  ],
};

export default nextConfig;
