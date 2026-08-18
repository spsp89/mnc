"use client";

import { ArrowRight, Compass, LocateFixed, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { homePopularSearches } from "@/lib/home-data";
import type { HomeBusiness, HomeCategory, HomeOffer } from "@/lib/home-types";
import type { SearchMode } from "@/components/search-box";

export function HeroSection({
  businesses,
  categories,
  offers,
}: {
  businesses: HomeBusiness[];
  categories: HomeCategory[];
  offers: HomeOffer[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState("5");
  const [mode, setMode] = useState<SearchMode>("businesses");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [promotionIndex, setPromotionIndex] = useState(0);
  const searchRef = useRef<HTMLFormElement>(null);
  const location = coordinates ? "Current location" : "Kochi";

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return homePopularSearches.slice(0, 5);
    const options = [
      ...categories.map((category) => category.name),
      ...businesses.map((item) => item.business.name),
      ...homePopularSearches,
    ];
    return [...new Set(options)]
      .filter((option) => option.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [businesses, categories, query]);

  const promotions = useMemo(() => {
    const offerPromotions = offers.map((offer) => ({
      id: `offer-${offer.id}`,
      eyebrow: `${offer.discountPercentage}% local saving`,
      title: offer.title,
      description: `${offer.businessName} · ${offer.expiryLabel}`,
      image: offer.image,
      href: "/offers",
    }));
    const businessPromotions = businesses.map(({ business }) => ({
      id: `business-${business.id}`,
      eyebrow: business.category,
      title: business.name,
      description: `${business.locality} · ${business.shortDescription}`,
      image: business.coverImage,
      href: `/business/${business.slug}`,
    }));
    return [...offerPromotions, ...businessPromotions].slice(0, 6);
  }, [businesses, offers]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSuggestionsOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSuggestionsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || promotions.length < 2) return;
    const interval = window.setInterval(() => {
      setPromotionIndex((current) => (current + 1) % promotions.length);
    }, 4_800);
    return () => window.clearInterval(interval);
  }, [promotions.length, reduceMotion]);

  const runSearch = (searchTerm = query) => {
    const params = new URLSearchParams({
      location,
      radius,
    });
    if (coordinates) {
      params.set("latitude", String(coordinates.latitude));
      params.set("longitude", String(coordinates.longitude));
    }
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    const destination = mode === "products" ? "/products" : mode === "services" ? "/services" : "/search";
    router.push(`${destination}?${params.toString()}`);
    setSuggestionsOpen(false);
  };

  const openMode = (nextMode: SearchMode) => {
    setMode(nextMode);
    setSuggestionsOpen(false);
    const params = new URLSearchParams({ location, radius });
    if (coordinates) {
      params.set("latitude", String(coordinates.latitude));
      params.set("longitude", String(coordinates.longitude));
    }
    const destination = nextMode === "products" ? "/products" : nextMode === "services" ? "/services" : "/search";
    router.push(`${destination}?${params.toString()}`);
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    runSearch();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    );
  };

  return (
    <section className="bnc-immersive-hero bnc-clean-hero" aria-labelledby="bnc-home-title">
      {businesses[0]?.business.coverImage && (
        <>
          <Image
            className="bnc-hero-backdrop"
            src={businesses[0].business.coverImage}
            alt=""
            fill
            priority
            sizes="100vw"
            aria-hidden="true"
          />
          <div className="bnc-hero-image-wash" aria-hidden="true" />
        </>
      )}

      <div className="bnc-hero-shell">
        {promotions.length > 0 && (
          <div className="bnc-home-promotions" aria-label="Featured BNC posters">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="bnc-home-promotion"
                key={promotions[promotionIndex].id}
                initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="bnc-home-promotion-copy">
                  <span>{promotions[promotionIndex].eyebrow}</span>
                  <strong>{promotions[promotionIndex].title}</strong>
                  <small>{promotions[promotionIndex].description}</small>
                  <button type="button" onClick={() => router.push(promotions[promotionIndex].href)}>
                    Explore now <ArrowRight size={16} />
                  </button>
                </div>
                <div className="bnc-home-promotion-image">
                  <Image
                    src={promotions[promotionIndex].image}
                    alt=""
                    fill
                    sizes="(max-width: 720px) 100vw, 54vw"
                    aria-hidden="true"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="bnc-home-promotion-progress" aria-label={`${promotionIndex + 1} of ${promotions.length}`}>
              {promotions.map((promotion, index) => (
                <button
                  type="button"
                  className={index === promotionIndex ? "is-active" : ""}
                  onClick={() => setPromotionIndex(index)}
                  aria-label={`Show poster ${index + 1}: ${promotion.title}`}
                  aria-current={index === promotionIndex ? "true" : undefined}
                  key={promotion.id}
                />
              ))}
            </div>
          </div>
        )}
        <motion.div
          className="bnc-hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span className="bnc-hero-kicker"><Sparkles size={14} /> Kerala&apos;s local discovery network</span>
          <h1 id="bnc-home-title">Everything local. <em>One search away.</em></h1>
          <p>
            Find trusted shops, skilled professionals, useful services and timely offers near you.
          </p>

          <div className="bnc-clean-search-suite">
            <div className="bnc-search-mode-tabs" role="group" aria-label="Choose what to search">
              <button type="button" aria-pressed={mode === "businesses"} className={mode === "businesses" ? "is-active" : ""} onClick={() => openMode("businesses")}>Shops & businesses</button>
              <button type="button" aria-pressed={mode === "products"} className={mode === "products" ? "is-active" : ""} onClick={() => openMode("products")}>Products & marketing</button>
              <button type="button" aria-pressed={mode === "services"} className={mode === "services" ? "is-active" : ""} onClick={() => openMode("services")}>Services, experts & consultants</button>
            </div>
            <form className="bnc-main-search bnc-clean-main-search" onSubmit={submit} role="search" ref={searchRef}>
              <div className="bnc-search-input">
                <Search size={22} />
                <label className="sr-only" htmlFor="bnc-home-search">Search BNC</label>
                <input
                  id="bnc-home-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  placeholder={mode === "products" ? "Search products and local sellers" : mode === "services" ? "Search services, experts or consultants" : "Search shops and businesses"}
                  autoComplete="off"
                />
              </div>
              <button
                className={coordinates ? "bnc-location-trigger is-active" : "bnc-location-trigger"}
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                aria-label={locating ? "Finding current location" : "Use current location"}
              >
                <LocateFixed size={18} />
              </button>
              <label className="bnc-radius-select">
                <span className="sr-only">Search radius</span>
                <Compass size={17} />
                <select value={radius} onChange={(event) => setRadius(event.target.value)}>
                  <option value="3">Within 3 km</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                </select>
              </label>
              <button className="bnc-search-submit" type="submit">
                <Search size={18} /> <span>Search</span>
              </button>

              <AnimatePresence>
                {suggestionsOpen && (
                  <motion.div
                    className="bnc-search-suggestions"
                    initial={reduceMotion ? false : { opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    role="listbox"
                    aria-label="Search suggestions"
                  >
                    <div><span>{query ? "Suggested matches" : "Popular around you"}</span><Sparkles size={15} /></div>
                    {suggestions.length ? suggestions.map((suggestion) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion);
                          runSearch(suggestion);
                        }}
                      >
                        <Search size={15} />
                        <span>{suggestion}</span>
                        <ArrowRight size={14} />
                      </button>
                    )) : (
                      <p>No direct match yet. Search to see all nearby options.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
