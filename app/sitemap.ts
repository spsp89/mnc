import type { MetadataRoute } from "next";
import { categories, cities } from "@/lib/catalog-data";
import { getPublicSitemapRecords } from "@/lib/public-api";
import { getSiteOrigin } from "@/lib/site-origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin();
  const live = await getPublicSitemapRecords();
  const staticRoutes = [
    "", "businesses", "search", "categories", "products", "services", "offers", "pricing",
    "locations", "about", "contact", "help", "privacy", "terms", "business/add",
    "business/claim", "business/success-stories", "app", "refunds", "report-abuse",
  ];
  const serviceRoutes = live.services.map((service) => ({
    url: `${origin}/services/${service.id}`,
    lastModified: service.updatedAt || undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const localCategoryRoutes = cities.flatMap((city) =>
    categories.map((category) => ({
      url: `${origin}/${city.name.toLowerCase().replace(/\s/g, "-")}/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
  );
  return [
    ...staticRoutes.map((route) => ({
      url: `${origin}/${route}`,
      changeFrequency: route === "" || route === "search" ? "daily" as const : "weekly" as const,
      priority: route === "" ? 1 : route === "search" ? 0.9 : 0.7,
    })),
    ...live.businesses.map((business) => ({
      url: `${origin}/business/${business.slug}`,
      lastModified: business.updatedAt || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...live.products.map((product) => ({
      url: `${origin}/products/${product.id}`,
      lastModified: product.updatedAt || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...serviceRoutes,
    ...localCategoryRoutes,
    ...cities.map((city) => ({
      url: `${origin}/offers/${city.name.toLowerCase().replace(/\s/g, "-")}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...cities.map((city) => ({
      url: `${origin}/${city.name.toLowerCase().replace(/\s/g, "-")}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
