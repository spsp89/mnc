import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SearchResultsView } from "@/components/search-results-view";
import { searchPublicBusinesses } from "@/lib/public-api";
import type { SearchFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search local businesses",
  description: "Compare trusted businesses, services and products near your selected location.",
};

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const filters: SearchFilters = {
    query: single(params.q) ?? "",
    location: single(params.location) ?? "",
    constituency: single(params.constituency) ?? undefined,
    district: single(params.district) ?? undefined,
    state: single(params.state) ?? undefined,
    latitude: Number(single(params.latitude)) || undefined,
    longitude: Number(single(params.longitude)) || undefined,
    radius: Number(single(params.radius) ?? 5),
    rating: Number(single(params.rating) ?? 0) || undefined,
    openNow: single(params.open) === "true",
    verified: single(params.verified) === "true",
    premium: single(params.premium) === "true",
    offers: single(params.offers) === "true",
    homeService: single(params.homeService) === "true",
    delivery: single(params.delivery) === "true",
    fastResponse: single(params.fastResponse) === "true",
    price: single(params.price) ?? undefined,
    payment: single(params.payment) ?? undefined,
    language: single(params.language) ?? undefined,
    minYears: Number(single(params.minYears) ?? 0) || undefined,
    sort: single(params.sort) ?? "recommended",
  };
  const results = await searchPublicBusinesses(filters);

  return (
    <AppShell>
      <SearchResultsView results={results} filters={filters} />
    </AppShell>
  );
}
