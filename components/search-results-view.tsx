"use client";

import {
  BadgeCheck,
  ChevronDown,
  Filter,
  List,
  Map,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BusinessCard } from "@/components/business-card";
import { PortalHero } from "@/components/portal-hero";
import { SearchBox } from "@/components/search-box";
import { businesses } from "@/lib/catalog-data";
import { openStreetMapEmbedUrl } from "@/lib/maps";
import type { Business, SearchFilters } from "@/lib/types";

const radiusOptions = [1, 3, 5, 10, 25, 50];

export function SearchResultsView({
  results,
  filters,
}: {
  results: Business[];
  filters: SearchFilters;
}) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [radius, setRadius] = useState(filters.radius ?? 5);
  const [rating, setRating] = useState(filters.rating ?? 0);
  const [openNow, setOpenNow] = useState(filters.openNow ?? false);
  const [verified, setVerified] = useState(filters.verified ?? false);
  const [premium, setPremium] = useState(filters.premium ?? false);
  const [offers, setOffers] = useState(filters.offers ?? false);
  const [homeService, setHomeService] = useState(filters.homeService ?? false);
  const [delivery, setDelivery] = useState(filters.delivery ?? false);
  const [fastResponse, setFastResponse] = useState(filters.fastResponse ?? false);
  const [price, setPrice] = useState(filters.price ?? "");
  const [payment, setPayment] = useState(filters.payment ?? "");
  const [language, setLanguage] = useState(filters.language ?? "");
  const [minYears, setMinYears] = useState(filters.minYears ?? 0);
  const [sort, setSort] = useState(filters.sort ?? "recommended");
  const heroLocation = filters.location || "Kerala";
  const heroSubject = filters.query || "local businesses";
  const heroBusiness = results[0] ?? businesses[0];
  const hasHistoryQuery = Boolean(filters.query?.trim());
  const historyPayload = JSON.stringify({
    query: filters.query?.trim() ?? "",
    language: "en",
    location: {
      label: filters.location ?? "",
      ...(filters.latitude === undefined ? {} : { latitude: filters.latitude }),
      ...(filters.longitude === undefined ? {} : { longitude: filters.longitude }),
    },
    filters: {
      radiusKm: filters.radius ?? 5,
      rating: filters.rating ?? 0,
      openNow: filters.openNow ?? false,
      verified: filters.verified ?? false,
      premium: filters.premium ?? false,
      offers: filters.offers ?? false,
      homeService: filters.homeService ?? false,
      delivery: filters.delivery ?? false,
      fastResponse: filters.fastResponse ?? false,
      price: filters.price ?? "",
      payment: filters.payment ?? "",
      language: filters.language ?? "",
      minYears: filters.minYears ?? 0,
      sort: filters.sort ?? "recommended",
    },
    resultCount: results.length,
  });

  useEffect(() => {
    if (!hasHistoryQuery) return;
    void fetch("/api/search-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: historyPayload,
    }).catch(() => {
      // Search remains public and useful even when history cannot be saved.
    });
  }, [hasHistoryQuery, historyPayload]);

  const activeFilterCount = useMemo(
    () => [rating > 0, openNow, verified, premium, offers, homeService, delivery, fastResponse, Boolean(price), Boolean(payment), Boolean(language), minYears > 0, radius !== 5].filter(Boolean).length,
    [delivery, fastResponse, homeService, language, minYears, offers, openNow, payment, premium, price, radius, rating, verified],
  );

  const applyFilters = (selectedSort = sort) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.location) params.set("location", filters.location);
    if (filters.constituency) params.set("constituency", filters.constituency);
    if (filters.district) params.set("district", filters.district);
    if (filters.state) params.set("state", filters.state);
    if (filters.latitude !== undefined) params.set("latitude", String(filters.latitude));
    if (filters.longitude !== undefined) params.set("longitude", String(filters.longitude));
    params.set("radius", String(radius));
    if (rating) params.set("rating", String(rating));
    if (openNow) params.set("open", "true");
    if (verified) params.set("verified", "true");
    if (premium) params.set("premium", "true");
    if (offers) params.set("offers", "true");
    if (homeService) params.set("homeService", "true");
    if (delivery) params.set("delivery", "true");
    if (fastResponse) params.set("fastResponse", "true");
    if (price) params.set("price", price);
    if (payment) params.set("payment", payment);
    if (language) params.set("language", language);
    if (minYears) params.set("minYears", String(minYears));
    if (selectedSort !== "recommended") params.set("sort", selectedSort);
    router.push(`/search?${params.toString()}`);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setRadius(5);
    setRating(0);
    setOpenNow(false);
    setVerified(false);
    setPremium(false);
    setOffers(false);
    setHomeService(false);
    setDelivery(false);
    setFastResponse(false);
    setPrice("");
    setPayment("");
    setLanguage("");
    setMinYears(0);
    setSort("recommended");
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.location) params.set("location", filters.location);
    if (filters.constituency) params.set("constituency", filters.constituency);
    if (filters.district) params.set("district", filters.district);
    if (filters.state) params.set("state", filters.state);
    if (filters.latitude !== undefined) params.set("latitude", String(filters.latitude));
    if (filters.longitude !== undefined) params.set("longitude", String(filters.longitude));
    params.set("radius", "5");
    router.push(`/search?${params.toString()}`);
  };

  const filterPanel = (
    <div className="filter-panel">
      <div className="filter-panel-heading">
        <div>
          <SlidersHorizontal size={18} />
          <strong>Filters</strong>
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </div>
        <button type="button" onClick={resetFilters}><RotateCcw size={14} /> Reset</button>
      </div>
      <div className="filter-group">
        <label>Search radius <strong>{radius} km</strong></label>
        <div className="radius-options">
          {radiusOptions.map((option) => (
            <button
              type="button"
              className={radius === option ? "active" : ""}
              onClick={() => setRadius(option)}
              key={option}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <label>Minimum rating</label>
        <div className="rating-filter">
          {[4.5, 4, 3.5].map((option) => (
            <button
              type="button"
              className={rating === option ? "active" : ""}
              onClick={() => setRating(rating === option ? 0 : option)}
              key={option}
            >
              {option}+ ★
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group toggle-group">
        <label>
          <span><strong>Open now</strong><small>Available to contact today</small></span>
          <input type="checkbox" checked={openNow} onChange={(event) => setOpenNow(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>Verified</strong><small>Identity and business proof checked</small></span>
          <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>BNC Select</strong><small>Premium profile and response tools</small></span>
          <input type="checkbox" checked={premium} onChange={(event) => setPremium(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>Offers available</strong><small>Has an active local promotion</small></span>
          <input type="checkbox" checked={offers} onChange={(event) => setOffers(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>Home service</strong><small>Can visit your selected location</small></span>
          <input type="checkbox" checked={homeService} onChange={(event) => setHomeService(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>Delivery available</strong><small>Lists products for local fulfilment</small></span>
          <input type="checkbox" checked={delivery} onChange={(event) => setDelivery(event.target.checked)} />
          <i />
        </label>
        <label>
          <span><strong>Fast response</strong><small>Usually responds within 15 minutes</small></span>
          <input type="checkbox" checked={fastResponse} onChange={(event) => setFastResponse(event.target.checked)} />
          <i />
        </label>
      </div>
      <div className="filter-group compact-options">
        <label>More options</label>
        <label className="filter-select-row"><span>Price range</span><select value={price} onChange={(event) => setPrice(event.target.value)}><option value="">Any</option><option value="₹">₹</option><option value="₹₹">₹₹</option><option value="₹₹₹">₹₹₹</option></select></label>
        <label className="filter-select-row"><span>Payment method</span><select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="">Any</option><option value="UPI">UPI</option><option value="Cards">Cards</option><option value="Cash">Cash</option><option value="Bank transfer">Bank transfer</option></select></label>
        <label className="filter-select-row"><span>Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Any</option><option value="Malayalam">Malayalam</option><option value="English">English</option><option value="Hindi">Hindi</option><option value="Tamil">Tamil</option></select></label>
        <label className="filter-select-row"><span>Years in business</span><select value={minYears} onChange={(event) => setMinYears(Number(event.target.value))}><option value={0}>Any</option><option value={5}>5+ years</option><option value={10}>10+ years</option></select></label>
      </div>
      <button className="apply-filters" type="button" onClick={() => applyFilters()}>
        Show matching businesses
      </button>
    </div>
  );

  return (
    <>
      <PortalHero
        eyebrow="BNC local search"
        title={<>Explore <em>{`${heroSubject} near ${heroLocation}`}</em>.</>}
        description="Compare location, availability, reputation and practical details without opening a dozen tabs."
        image={heroBusiness?.coverImage}
        imageAlt={heroBusiness ? `${heroBusiness.name} in the BNC local directory` : `BNC search results in ${heroLocation}`}
        tone="search-results-hero"
        mediaLabel={`${results.length} useful places to compare`}
      >
        <div className="results-hero-search">
          <SearchBox
            initialQuery={filters.query}
            initialLocation={filters.location}
            initialLatitude={filters.latitude}
            initialLongitude={filters.longitude}
            compact
          />
        </div>
      </PortalHero>
      <div className="results-page">
        <aside className="desktop-filters">{filterPanel}</aside>
        <section className="results-column">
          <div className="results-summary">
            <div>
              <span className="eyebrow">Local results</span>
              <h1>{results.length} matches worth comparing.</h1>
              <p>
                {filters.latitude !== undefined && filters.longitude !== undefined
                  ? `Within ${filters.radius ?? 5} km of your GPS location · Distances are calculated from published coordinates`
                  : `Showing listings for ${heroLocation} · Use current location for a true ${filters.radius ?? 5} km radius`}
              </p>
            </div>
            <div className="summary-badge">
              <BadgeCheck size={18} />
              <span><strong>Transparent order</strong>Higher BNC plans rank first; ties use the earliest plan start date.</span>
            </div>
          </div>

          <div className="results-toolbar">
            <button className="mobile-filter-button" type="button" onClick={() => setFilterOpen(true)}>
              <Filter size={17} /> Filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
            </button>
            <div className="result-pills">
              <button className={openNow ? "active" : ""} type="button" onClick={() => setOpenNow((value) => !value)}>Open now</button>
              <button className={verified ? "active" : ""} type="button" onClick={() => setVerified((value) => !value)}>Verified</button>
              <button className={offers ? "active" : ""} type="button" onClick={() => setOffers((value) => !value)}>Offers</button>
            </div>
            <label className="sort-select">
              <span>Sort</span>
              <select
                value={sort}
                onChange={(event) => {
                  const selectedSort = event.target.value;
                  setSort(selectedSort);
                  applyFilters(selectedSort);
                }}
                aria-label="Sort results"
              >
                <option value="recommended">Recommended</option>
                <option value="nearest">Nearest first</option>
                <option value="rating">Highest rated</option>
                <option value="reviews">Most reviewed</option>
                <option value="recent">Recently added</option>
                <option value="relevant">Most relevant</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <div className="view-toggle">
              <button className={view === "list" ? "active" : ""} type="button" onClick={() => setView("list")} aria-label="List view"><List size={17} /></button>
              <button className={view === "map" ? "active" : ""} type="button" onClick={() => setView("map")} aria-label="Map view"><Map size={17} /></button>
            </div>
          </div>

          {results.length > 0 ? (
            <div className={view === "map" ? "mobile-map-layout" : ""}>
              <div className="results-list">
                {results.map((business) => (
                  <BusinessCard business={business} layout="list" key={business.id} />
                ))}
              </div>
              {view === "map" && (
                <div className="mobile-results-map">
                  <iframe
                    title={`Businesses near ${heroLocation} map`}
                    src={openStreetMapEmbedUrl(heroBusiness!.latitude, heroBusiness!.longitude)}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="empty-results">
              <span><MapPin size={28} /></span>
              <h2>No exact matches in this radius</h2>
              <p>Try a wider distance or remove one of the filters. We will keep your search terms intact.</p>
              <button type="button" onClick={resetFilters}>Reset filters</button>
            </div>
          )}
        </section>
        <aside className="results-map">
          <div className="map-frame">
            {heroBusiness ? (
              <>
                <iframe
                  title={`Businesses near ${heroLocation} map`}
                  src={openStreetMapEmbedUrl(heroBusiness.latitude, heroBusiness.longitude)}
                  loading="lazy"
                />
                <div className="map-result-count"><Sparkles size={15} /> {results.length} places in this area</div>
              </>
            ) : (
              <div className="map-unavailable"><MapPin size={28} /><strong>No locations to map</strong><small>Backend-supplied coordinates will appear here.</small></div>
            )}
          </div>
        </aside>
      </div>

      {filterOpen && (
        <div className="filter-sheet-backdrop" role="presentation">
          <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="Search filters">
            <div className="filter-sheet-top">
              <strong>Refine results</strong>
              <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={21} /></button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </>
  );
}
