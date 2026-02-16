import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// ✅ wrapper tipado pro next-pwa no NextConfig (TS)
const withPWA = (withPWAInit as unknown as (opts: any) => (cfg: NextConfig) => NextConfig)({
  dest: "public",
  register: true,
  skipWaiting: true,

  // ✅ não roda SW em dev
  disable: process.env.NODE_ENV === "development",

  // ✅ evita cache agressivo do manifest/ícones (ajuda muito em update de ícone)
  // (pode remover depois que estabilizar)
  buildExcludes: [/manifest\.json$/i, /site\.webmanifest$/i],

  // ✅ fallback offline simples (crie /public/offline.html se quiser)
  // fallback: { document: "/offline.html" },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ next-pwa precisa de webpack; turbopack ainda não é compatível
  // deixe o objeto, e garanta que você NÃO está rodando "next dev --turbopack"
  turbopack: {},

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // ✅ headers úteis pra PWA (especialmente Android/Chrome)
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
    ];
  },
};

export default withPWA(nextConfig);
