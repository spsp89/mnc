"use client";

import {
  LocateFixed,
  MapPin,
  Mic,
  Navigation,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { businesses, popularSearches } from "@/lib/catalog-data";

export type SearchMode = "businesses" | "products" | "services";

type SpeechRecognitionEventLike = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  lang: string;
  start: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function SearchBox({
  initialQuery = "",
  initialLocation = "Kochi",
  initialLatitude,
  initialLongitude,
  initialMode = "businesses",
  compact = false,
}: {
  initialQuery?: string;
  initialLocation?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  initialMode?: SearchMode;
  compact?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [locating, setLocating] = useState(false);
  const [manualLocationOpen, setManualLocationOpen] = useState(false);
  const [manualLatitude, setManualLatitude] = useState(initialLatitude === undefined ? "" : String(initialLatitude));
  const [manualLongitude, setManualLongitude] = useState(initialLongitude === undefined ? "" : String(initialLongitude));
  const [locationNotice, setLocationNotice] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const boxRef = useRef<HTMLFormElement>(null);

  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return popularSearches.slice(0, 4).map((label) => ({ label, meta: "Popular search" }));
    }

    return businesses
      .filter((business) =>
        [
          business.name,
          business.category,
          business.subcategory,
          business.city,
          business.locality,
          ...business.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 5)
      .map((business) => ({
        label: business.name,
        meta: `${business.subcategory} · ${business.locality}`,
      }));
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));
    params.set("radius", "5");
    const destination = mode === "products" ? "/products" : mode === "services" ? "/services" : "/search";
    router.push(`${destination}?${params.toString()}`);
    setFocused(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice("Automatic GPS is unavailable in this browser. Set a precise map pin below.");
      setManualLocationOpen(true);
      return;
    }
    setLocating(true);
    setLocationNotice("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setManualLatitude(String(position.coords.latitude));
        setManualLongitude(String(position.coords.longitude));
        setLocation("Current location");
        setLocationNotice("Precise location ready. Search will use a true 5 km radius.");
        setLocating(false);
      },
      (error) => {
        setLatitude(undefined);
        setLongitude(undefined);
        setLocationNotice(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was not granted. Set a precise map pin below to keep the 5 km search accurate."
            : "Automatic GPS could not determine your position. Set a precise map pin below.",
        );
        setManualLocationOpen(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  const applyManualLocation = () => {
    const nextLatitude = Number(manualLatitude);
    const nextLongitude = Number(manualLongitude);
    if (
      !Number.isFinite(nextLatitude)
      || !Number.isFinite(nextLongitude)
      || nextLatitude < -90
      || nextLatitude > 90
      || nextLongitude < -180
      || nextLongitude > 180
    ) {
      setLocationNotice("Enter a valid latitude from −90 to 90 and longitude from −180 to 180.");
      return;
    }
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocation("Pinned location");
    setLocationNotice("Precise map pin ready. Search will use a true 5 km radius.");
    setManualLocationOpen(false);
  };

  const clearPreciseLocation = () => {
    setLatitude(undefined);
    setLongitude(undefined);
    setManualLatitude("");
    setManualLongitude("");
    setLocation("");
    setLocationNotice("Precise location cleared. Results will use the locality text instead.");
  };

  const startVoiceSearch = () => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setQuery("photographer near me");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    setListening(true);
    recognition.onresult = (event) => {
      setQuery(event.results[0]?.[0]?.transcript ?? "");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <form
      className={`global-search ${compact ? "compact" : ""}`}
      onSubmit={submit}
      ref={boxRef}
      role="search"
    >
      <div className="search-mode-switch" role="group" aria-label="Choose what to search">
        <button type="button" className={mode === "businesses" ? "active" : ""} onClick={() => setMode("businesses")}>Shops & businesses</button>
        <button type="button" className={mode === "products" ? "active" : ""} onClick={() => setMode("products")}>Products</button>
        <button type="button" className={mode === "services" ? "active" : ""} onClick={() => setMode("services")}>Services & experts</button>
      </div>
      <div className="search-location-field">
        <MapPin size={20} />
        <label>
          <span>Location</span>
          <input
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              setLatitude(undefined);
              setLongitude(undefined);
            }}
            onFocus={() => setFocused(true)}
            aria-label="Search location"
          />
        </label>
        <button type="button" onClick={useCurrentLocation} aria-label={locating ? "Finding current location" : "Use current location"} disabled={locating}>
          <LocateFixed size={18} />
        </button>
      </div>
      <div className="search-query-field">
        <Search size={21} />
        <label>
          <span>What do you need?</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Try “laptop repair nearby”"
            aria-label="Search businesses, products and services"
          />
        </label>
        <button
          type="button"
          className={listening ? "listening" : ""}
          onClick={startVoiceSearch}
          aria-label="Search by voice"
        >
          <Mic size={19} />
        </button>
      </div>
      <button className="search-submit" type="submit">
        <Search size={19} />
        <span>Search</span>
      </button>

      <div className="search-location-tools">
        <button type="button" onClick={() => setManualLocationOpen((open) => !open)}>
          <MapPin size={14} />
          {manualLocationOpen ? "Close precise pin" : "Set precise pin"}
        </button>
        {latitude !== undefined && longitude !== undefined && (
          <>
            <span>{latitude.toFixed(5)}, {longitude.toFixed(5)} · 5 km</span>
            <button type="button" onClick={clearPreciseLocation}>Clear pin</button>
          </>
        )}
        {locationNotice && <small role="status" aria-live="polite">{locationNotice}</small>}
      </div>

      {manualLocationOpen && (
        <div className="manual-location-panel">
          <div>
            <strong>Set your exact location</strong>
            <small>Paste a map latitude and longitude when browser GPS is unavailable.</small>
          </div>
          <label>
            Latitude
            <input
              type="number"
              min="-90"
              max="90"
              step="0.000001"
              inputMode="decimal"
              value={manualLatitude}
              onChange={(event) => setManualLatitude(event.target.value)}
              placeholder="9.931233"
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              min="-180"
              max="180"
              step="0.000001"
              inputMode="decimal"
              value={manualLongitude}
              onChange={(event) => setManualLongitude(event.target.value)}
              placeholder="76.267303"
            />
          </label>
          <button type="button" onClick={applyManualLocation}>Use this 5 km pin</button>
        </div>
      )}

      {focused && (
        <div className="search-suggestions">
          <div className="suggestion-heading">
            <span>{query ? "Suggested matches" : "Popular around you"}</span>
            {!query && <Sparkles size={15} />}
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.label}-${suggestion.meta}`}
              type="button"
              onClick={() => {
                setQuery(suggestion.label);
                queueMicrotask(() => submit());
              }}
            >
              <span className="suggestion-icon"><Search size={16} /></span>
              <span>
                <strong>{suggestion.label}</strong>
                <small>{suggestion.meta}</small>
              </span>
              <Navigation size={15} />
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
