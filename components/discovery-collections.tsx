"use client";

import { ArrowRight, Clock3, MapPin, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { businesses } from "@/lib/catalog-data";
import type { Business } from "@/lib/types";

const newest = [...businesses]
  .filter((business) => business.joinedPlanAt)
  .sort((left, right) => (right.joinedPlanAt ?? "").localeCompare(left.joinedPlanAt ?? ""))
  .slice(0, 2);

const topRated = [...businesses]
  .sort((left, right) => right.rating - left.rating || right.reviewCount - left.reviewCount)
  .slice(0, 2);

const RECENT_KEY = "bnc-recently-viewed-v1";

function subscribeToRecent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("bnc-recently-viewed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("bnc-recently-viewed", callback);
  };
}

const recentClientSnapshot = () => localStorage.getItem(RECENT_KEY) ?? "[]";
const recentServerSnapshot = () => "[]";

function MiniBusiness({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.slug}`}>
      <span><Image src={business.coverImage} alt="" fill sizes="62px" /></span>
      <div>
        <strong>{business.name}</strong>
        <small><MapPin size={12} /> {business.locality} · {business.city}</small>
      </div>
      <ArrowRight size={15} />
    </Link>
  );
}

export function DiscoveryCollections() {
  const recentJson = useSyncExternalStore(subscribeToRecent, recentClientSnapshot, recentServerSnapshot);
  const recent = useMemo(() => {
    try {
      const ids = JSON.parse(recentJson) as string[];
      return ids.flatMap((id) => {
        const business = businesses.find((candidate) => candidate.id === id);
        return business ? [business] : [];
      }).slice(0, 2);
    } catch {
      return [];
    }
  }, [recentJson]);

  return (
    <section className="page-section discovery-collections">
      <div className="section-heading">
        <div>
          <span className="eyebrow">More ways to discover</span>
          <h2>Keep exploring local favourites</h2>
          <p>Return to a recent profile, begin with trusted ratings or meet a newly listed business.</p>
        </div>
      </div>
      <div className="discovery-collection-grid">
        <article>
          <div className="collection-title"><Clock3 size={18} /><div><h3>Recently viewed</h3><p>Stored only in this browser</p></div></div>
          {recent.length ? recent.map((business) => <MiniBusiness business={business} key={business.id} />) : (
            <div className="collection-empty"><p>Profiles you open will appear here.</p><Link href="/search">Start exploring <ArrowRight size={14} /></Link></div>
          )}
        </article>
        <article>
          <div className="collection-title"><Star size={18} /><div><h3>Top rated</h3><p>Strong verified feedback</p></div></div>
          {topRated.length ? topRated.map((business) => <MiniBusiness business={business} key={business.id} />) : <div className="collection-empty"><p>No rated businesses published yet.</p></div>}
        </article>
        <article>
          <div className="collection-title"><Sparkles size={18} /><div><h3>New on BNC</h3><p>Recently completed profiles</p></div></div>
          {newest.length ? newest.map((business) => <MiniBusiness business={business} key={business.id} />) : <div className="collection-empty"><p>No new businesses published yet.</p></div>}
        </article>
      </div>
    </section>
  );
}
