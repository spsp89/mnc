"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import type { CatalogBusinessData, CatalogData, CatalogSort } from "@/lib/catalog";
import { AnalyticsLink } from "./analytics-tracker";
import { ChevronRight, Heart, MapPin, Phone, Search, Star } from "lucide-react";

type SearchState = {
  query: string;
  category: string;
  featured: boolean;
  popular: boolean;
  sort: CatalogSort;
};

const variantImages: Record<string, string> = {
  plate: "/mockup/im-restaurant.jpg",
  suit: "/mockup/im-card_suit.jpg",
  basket: "/mockup/im-vegetables.jpg",
  salon: "/mockup/im-beauty.jpg",
  shelf: "/mockup/im-supermarket.jpg",
  phone: "/mockup/im-mobile.jpg",
  worker: "/mockup/im-occ_helper.jpg",
};

const sortOptions: Array<{ label: string; value: SearchState["sort"] }> = [
  { label: "Best match", value: "default" },
  { label: "Top rated", value: "rating" },
  { label: "Nearby", value: "distance" },
  { label: "Name", value: "name" },
];

export function PublicSearchPanel({ initialData }: { initialData: CatalogData }) {
  const [filters, setFilters] = useState<SearchState>({
    query: initialData.filters.query,
    category: initialData.filters.category,
    featured: initialData.filters.featured === true,
    popular: initialData.filters.popular === true,
    sort: isSort(initialData.filters.sort) ? initialData.filters.sort : "default",
  });
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const resultCount = data.meta?.total ?? data.stats.businesses;
  const businesses = data.all ?? [];
  const hasActiveFilters = Boolean(
    filters.query ||
      filters.category ||
      filters.featured ||
      filters.popular ||
      filters.sort !== "default",
  );

  const params = useMemo(() => {
    const next = new URLSearchParams();

    if (filters.query.trim()) {
      next.set("q", filters.query.trim());
    }

    if (filters.category) {
      next.set("category", filters.category);
    }

    if (filters.featured) {
      next.set("featured", "true");
    }

    if (filters.popular) {
      next.set("popular", "true");
    }

    if (filters.sort !== "default") {
      next.set("sort", filters.sort);
    }

    next.set("limit", "60");
    return next;
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(`/api/catalog?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        const nextData = await parseCatalogResponse(response);
        setData(nextData);
        setStatus("idle");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setStatus("error");
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [params]);

  function updateFilters(next: Partial<SearchState>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function clearFilters() {
    setFilters({
      query: "",
      category: "",
      featured: false,
      popular: false,
      sort: "default",
    });
  }

  return (
    <section id="all-shops" className="mt-7 scroll-mt-24 sm:mt-9">
      <div className="rounded-[18px] border border-[#dfe6f2] bg-white p-3 shadow-[0_14px_30px_rgba(11,47,116,0.06)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center rounded-[15px] border border-[#dfe6f2] bg-[#f8fbff] px-3 py-2.5">
            <Search className="h-5 w-5 shrink-0 text-[#8ea0bd]" />
            <input
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              className="min-w-0 flex-1 bg-transparent px-3 text-[14px] font-semibold text-[#102c61] outline-none placeholder:text-[#71809b]"
              placeholder="Search shops, products, services or deals"
            />
          </div>
          <select
            value={filters.category}
            onChange={(event) => updateFilters({ category: event.target.value })}
            className="h-11 rounded-[13px] border border-[#dfe6f2] bg-white px-3 text-[13px] font-black text-[#0b2f74] outline-none"
          >
            <option value="">All categories</option>
            {data.categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) => updateFilters({ sort: event.target.value as SearchState["sort"] })}
            className="h-11 rounded-[13px] border border-[#dfe6f2] bg-white px-3 text-[13px] font-black text-[#0b2f74] outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="-mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
          <FilterChip
            active={!filters.featured && !filters.popular}
            label="All"
            onClick={() => updateFilters({ featured: false, popular: false })}
          />
          <FilterChip
            active={filters.featured}
            label="Featured"
            onClick={() => updateFilters({ featured: !filters.featured, popular: false })}
          />
          <FilterChip
            active={filters.popular}
            label="Popular"
            onClick={() => updateFilters({ popular: !filters.popular, featured: false })}
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-full border border-[#cbd7ea] bg-white px-4 py-2 text-[11px] font-black text-[#0b2f74] sm:px-5 sm:py-2.5 sm:text-[12px]"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-black leading-tight text-[#0b2f74] sm:text-[25px]">
            {hasActiveFilters ? "Search results" : "All shops in Kozhikode"}
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#71809b]">
            {status === "loading" ? "Searching catalog..." : `${resultCount} result${resultCount === 1 ? "" : "s"} from trusted local businesses`}
          </p>
        </div>
        {status === "error" ? (
          <p className="text-[13px] font-black text-[#d94842]">
            Search is unavailable. Try again in a moment.
          </p>
        ) : null}
      </div>

      {status === "loading" && businesses.length === 0 ? (
        <SearchSkeleton />
      ) : businesses.length > 0 ? (
        <div className={`mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${status === "loading" ? "opacity-60" : ""}`}>
          {businesses.map((business) => (
            <SearchResultCard key={business.slug} business={business} />
          ))}
        </div>
      ) : (
        <div className="rounded-[16px] border border-dashed border-[#cbd7ea] bg-white px-5 py-10 text-center shadow-[0_10px_22px_rgba(11,47,116,0.04)]">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#edf3ff] text-[#0b2f74]">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-[16px] font-black text-[#0b2f74]">No matching businesses</h3>
          <p className="mx-auto mt-1 max-w-[420px] text-[13px] font-semibold leading-5 text-[#71809b]">
            Try a shorter keyword, another category, or clear the current filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 inline-flex rounded-full bg-[#f5b625] px-5 py-2.5 text-[13px] font-black text-[#08285f]"
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}

async function parseCatalogResponse(response: Response): Promise<CatalogData> {
  const body = (await response.json().catch(() => null)) as
    | CatalogData
    | { ok: false; error?: { message?: string } }
    | null;

  if (!response.ok || !body || body.ok === false) {
    throw new Error(
      body && "error" in body && body.error?.message
        ? body.error.message
        : "Catalog search failed",
    );
  }

  return body;
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black sm:px-5 sm:py-2.5 sm:text-[12px] ${
        active
          ? "border-[#0b2f74] bg-[#0b2f74] text-white"
          : "border-[#dfe6f2] bg-white text-[#405474]"
      }`}
    >
      {label}
    </button>
  );
}

function SearchResultCard({ business }: { business: CatalogBusinessData }) {
  const image = imageForBusiness(business);
  const badge = business.badge.text ?? (business.flags.featured ? "Featured" : business.flags.popular ? "Popular" : "Verified");
  const badgeColor = business.badge.color ?? (business.flags.featured ? "#2469d6" : business.flags.popular ? "#f4a51c" : "#25a451");
  const detailHref = `/business/${encodeURIComponent(business.slug)}`;
  const phoneHref = business.contact.phone ? `tel:${business.contact.phone.replace(/[^\d+]/g, "")}` : "";
  const directionsHref = directionsHrefForBusiness(business);

  return (
    <article data-motion="card" className="relative flex h-full flex-col overflow-hidden rounded-[14px] border border-[#dfe6f2] bg-white shadow-[0_12px_25px_rgba(11,47,116,0.06)]">
      <Link href={detailHref} aria-label={`View ${business.name}`} className="absolute inset-0 z-[1]" />
      <div className="relative h-[118px] bg-slate-100 sm:h-[140px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-black/8" />
        <span className="absolute left-2 top-2 rounded-[6px] px-2 py-0.5 text-[9.5px] font-black text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]" style={{ backgroundColor: badgeColor }}>
          {badge}
        </span>
        <button className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/24 text-white sm:right-3 sm:top-3 sm:h-8 sm:w-8">
          <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col px-3 py-3">
        <h3 className="truncate text-[14px] font-black leading-tight text-[#0b2f74]">{business.name}</h3>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <span className="truncate text-[12px] font-black text-[#405474]">{business.category.name || business.subtitle}</span>
          <span className="hidden truncate text-[11.5px] font-semibold text-[#71809b] sm:inline">• {business.location.area}, {business.location.city}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-5 text-[#62718d]">
          {business.description || business.subtitle}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#71809b]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
            <span className="font-black text-[#0b2f74]">{formatRating(business.rating.score)}</span>
            <span>({business.rating.reviewCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#f5b625]" />
            {formatDistance(business.location.distanceKm)} km
          </span>
        </div>
        <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 pt-3">
          <Link href={detailHref} className="inline-flex items-center justify-center gap-1 rounded-full bg-[#f5b625] px-2 py-2 text-center text-[11px] font-black text-[#08285f]">
            Open
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          {phoneHref ? (
            <AnalyticsLink businessSlug={business.slug} eventType="call_click" source="search_result_card" href={phoneHref} className="inline-flex items-center justify-center gap-1 rounded-full border border-[#dfe6f2] bg-white px-2 py-2 text-[11px] font-black text-[#0b2f74]">
              <Phone className="h-3.5 w-3.5" />
              Call
            </AnalyticsLink>
          ) : (
            <span className="rounded-full border border-[#edf3ff] px-2 py-2 text-center text-[11px] font-black text-[#9aa8bd]">Call</span>
          )}
          <AnalyticsLink businessSlug={business.slug} eventType="route_click" source="search_result_card" href={directionsHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 rounded-full border border-[#dfe6f2] bg-white px-2 py-2 text-[11px] font-black text-[#0b2f74]">
            <MapPin className="h-3.5 w-3.5" />
            Route
          </AnalyticsLink>
        </div>
      </div>
    </article>
  );
}

function SearchSkeleton() {
  return (
    <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[13px] border border-[#dfe6f2] bg-white">
          <div className="h-[118px] animate-pulse bg-[#e9eef7] sm:h-[140px]" />
          <div className="space-y-2 px-3 py-3">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#e9eef7]" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#e9eef7]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[#e9eef7]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function imageForBusiness(business: CatalogBusinessData) {
  const image =
    business.images.find((item) => item.role === "thumbnail") ??
    business.images.find((item) => item.role === "cover") ??
    business.images.find((item) => item.isPrimary) ??
    business.images[0];

  return image
    ? image.url || variantImages[image.variant] || "/mockup/im-restaurant.jpg"
    : "/mockup/im-restaurant.jpg";
}

function formatRating(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "4.6";
}

function formatDistance(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "1.2";
}

function directionsHrefForBusiness(business: CatalogBusinessData) {
  const { latitude, longitude, addressLine, area, city } = business.location;
  const query =
    latitude !== null && longitude !== null
      ? `${latitude},${longitude}`
      : [business.name, addressLine, area, city].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isSort(value: string): value is SearchState["sort"] {
  return value === "default" || value === "rating" || value === "distance" || value === "name";
}
