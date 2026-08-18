import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductsView } from "@/components/products-view";
import { getPublicCategories, getPublicProducts } from "@/lib/public-api";
import type { ProductStockStatus, SearchFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Local marketplace",
  description: "Browse products available from local sellers across Kerala.",
};

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const productStatuses = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "MADE_TO_ORDER"] as const;
const productSorts = ["recommended", "best-selling", "nearest", "newest", "price-low", "price-high", "name", "category", "location", "status"] as const;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const requestedStatus = single(params.status);
  const requestedSort = single(params.sort);
  const filters: SearchFilters = {
    query: single(params.q) ?? "",
    location: single(params.location) ?? "",
    constituency: single(params.constituency) ?? undefined,
    district: single(params.district) ?? undefined,
    state: single(params.state) ?? undefined,
    category: single(params.category) ?? "",
    productStatus: productStatuses.includes(requestedStatus as ProductStockStatus)
      ? requestedStatus as ProductStockStatus
      : undefined,
    courier: single(params.courier) === "true",
    latitude: Number(single(params.latitude)) || undefined,
    longitude: Number(single(params.longitude)) || undefined,
    radius: Number(single(params.radius) ?? 5),
    sort: productSorts.includes(requestedSort as (typeof productSorts)[number])
      ? requestedSort
      : "recommended",
  };
  const [products, categories] = await Promise.all([
    getPublicProducts(filters),
    getPublicCategories(),
  ]);
  return <AppShell><ProductsView products={products} filters={filters} categories={categories} /></AppShell>;
}
