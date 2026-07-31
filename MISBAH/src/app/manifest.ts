import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Misbah Salam — The Brand Strategist",
    short_name: "Misbah Salam",
    description:
      "Brand strategy, positioning and leadership advisory for founders and leadership teams.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#090a0a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
