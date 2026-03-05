import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// ✅ wrapper tipado pro next-pwa no NextConfig (TS)
const withPWA = (withPWAInit as unknown as (opts: any) => (cfg: NextConfig) => NextConfig)({
  dest: "public",
  register: true,
  skipWaiting: true,

  // ✅ não roda SW em dev
  disable: process.env.NODE_ENV !== "production",

  // ✅ se quiser offline depois, descomenta e cria /public/offline.html
  // fallback: { document: "/offline.html" },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // ✅ evita o erro do Next 16 (turbopack default + plugin que usa webpack)
  // (não “migra” o plugin, só para o warning/error e deixa explícito)
  turbopack: {},

  // ✅ headers úteis pra PWA (especialmente Android/Chrome) + evitar cache de ícone/manifest
  async headers() {
    return [
      {
        source: "/site.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/apple-touch-icon.png",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/icon-192.png",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/icon-512.png",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default withPWA(nextConfig);
