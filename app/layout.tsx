import "./globals.css";
import React from "react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Gestão Pizza Blu - Fintex",
  description: "Gestão financeira inteligente para bares e restaurantes",

  // ✅ Android / Chrome (PWA) + Fallbacks (favicon)
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",

    // ✅ iPhone / iOS (Add to Home Screen)
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },

  // ✅ PWA manifest (Android/Chrome/Edge)
  manifest: "/site.webmanifest",

  // ✅ Some browsers still read it here
  themeColor: "#041328",

  // ✅ iOS standalone
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fintex",
  },
};

export const viewport: Viewport = {
  themeColor: "#041328",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="fintex-body">{children}</body>
    </html>
  );
}
