import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ServicesView } from "@/components/services-view";
import { getPublicServices } from "@/lib/public-api";
import type { SearchFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Local services",
  description: "Compare trusted local service providers, prices and availability across Kerala.",
};

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
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
    sort: single(params.sort) === "top-rated" ? "top-rated" : "recommended",
  };
  const services = await getPublicServices(filters);
  return <AppShell><ServicesView liveServices={services} filters={filters} /></AppShell>;
}
