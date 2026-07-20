import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CategoryListingPage } from "@/components/nearu/public-home";
import { getCatalogData, getCategoriesData, type CatalogSort } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
    featured?: string;
    popular?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (slug === "doctor-booking") {
    return {
      title: pageTitle("Doctor Booking"),
      description: "Book doctor appointments and discover nearby clinics through the BNC ecosystem.",
      alternates: { canonical: "/doctor-booking" },
    };
  }

  const categories = getCategoriesData();
  const category = categories.find((item) => item.slug === slug);
  const data = await getCatalogData({
    query: query.q,
    category: slug,
    featured: query.featured === "true" ? true : undefined,
    popular: query.popular === "true" ? true : undefined,
    sort: parseSort(query.sort),
  });
  const categoryName = category?.name ?? titleFromSlug(slug);
  const description = `Browse ${data.meta.total} ${categoryName.toLowerCase()} business${data.meta.total === 1 ? "" : "es"} on Nearu, including local listings, contact details, ratings, and nearby services.`;
  const canonical = `/category/${encodeURIComponent(slug)}`;

  return {
    title: pageTitle(`${categoryName} Businesses`),
    description,
    alternates: {
      canonical,
    },
    openGraph: defaultOpenGraph({
      title: pageTitle(`${categoryName} Businesses`),
      description,
      url: absoluteUrl(canonical),
    }),
    twitter: {
      card: "summary_large_image",
      title: pageTitle(`${categoryName} Businesses`),
      description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (slug === "doctor-booking") {
    redirect("/doctor-booking");
  }

  const categories = getCategoriesData();
  const category = categories.find((item) => item.slug === slug) ?? null;
  const data = await getCatalogData({
    query: query.q,
    category: slug,
    featured: query.featured === "true" ? true : undefined,
    popular: query.popular === "true" ? true : undefined,
    sort: parseSort(query.sort),
  });

  return <CategoryListingPage data={data} category={category} slug={slug} />;
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function parseSort(value?: string): CatalogSort {
  if (value === "rating" || value === "distance" || value === "name") {
    return value;
  }

  return "default";
}
