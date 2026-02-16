import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fintex WebApp",
    short_name: "Fintex",
    start_url: "/m",
    display: "standalone", // SEM BARRA
    background_color: "#020b18",
    theme_color: "#041328",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
