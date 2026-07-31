import type { MetadataRoute } from "next";
import { services } from "@/app/_data/services";
import { insights } from "@/app/_data/insights";
import { siteUrl } from "@/app/_data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ["", "weekly", 1],
    ["/about", "monthly", 0.8],
    ["/services", "monthly", 0.9],
    ["/work", "monthly", 0.8],
    ["/work/oxygen-brand-evolution", "monthly", 0.7],
    ["/insights", "weekly", 0.7],
    ["/contact", "yearly", 0.7],
    ["/privacy", "yearly", 0.2],
    ["/terms", "yearly", 0.2],
  ] as const;

  return [
    ...routes.map(([path, changeFrequency, priority]) => ({
      url: `${siteUrl}${path}`,
      changeFrequency,
      priority,
    })),
    ...Object.keys(services).map((slug) => ({
      url: `${siteUrl}/services/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...Object.keys(insights).map((slug) => ({
      url: `${siteUrl}/insights/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
