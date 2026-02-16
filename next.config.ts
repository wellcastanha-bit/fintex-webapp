import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = (withPWAInit as unknown as (opts: any) => (cfg: NextConfig) => NextConfig)({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withPWA(nextConfig);
