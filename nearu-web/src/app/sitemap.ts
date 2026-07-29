import type { MetadataRoute } from "next";

import { getBusinessesForSitemap, getCategoriesData, getDealsData, getOffersData } from "@/lib/catalog";
import { categoryItemGroups } from "@/lib/category-items";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const categories = getCategoriesData();
  const businesses = getBusinessesForSitemap();
  const deals = getDealsData();
  const offers = getOffersData();
  const ecosystemRoutes = ["/about", "/contact", "/terms", "/privacy", "/list-your-business", "/deals", "/offers", "/featured-shops", "/business-card", "/b2b", "/jobs", "/doctor-booking", "/winner", "/feed", "/plans", "/dashboard", "/help"];

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...ecosystemRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...deals.map((deal) => ({
      url: absoluteUrl(`/deals/${deal.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...offers.map((offer) => ({
      url: absoluteUrl(`/offers/${offer.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...businesses
      .filter((business) => business.flags.featured)
      .map((business) => ({
        url: absoluteUrl(`/featured-shops/${business.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...categories.filter((category) => category.slug !== "doctor-booking").map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...categoryItemGroups.flatMap((group) =>
      group.items.map((item) => ({
        url: absoluteUrl(`/category/${group.categorySlug}/${item.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
    ),
    ...businesses.map((business) => ({
      url: absoluteUrl(`/business/${business.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: business.flags.featured || business.flags.popular ? 0.8 : 0.6,
    })),
    ...businesses.map((business) => ({
      url: absoluteUrl(`/business-card/${business.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: business.trust.verified ? 0.75 : 0.55,
    })),
  ];
}
