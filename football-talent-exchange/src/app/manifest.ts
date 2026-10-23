import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Football Talent Exchange",
    short_name: "TalentExchange",
    description: "La vitrine internationale des footballeurs.",
    start_url: "/tableau-de-bord",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f5",
    theme_color: "#15803d",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
