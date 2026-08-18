import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BNC — Trusted local discovery",
    short_name: "BNC",
    description: "Find and contact trusted local businesses across Kerala.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f48d8",
    lang: "en-IN",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
