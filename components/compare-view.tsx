"use client";

import { BadgeCheck, Check, MapPin, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { businesses } from "@/lib/catalog-data";

export function CompareView() {
  const [selected, setSelected] = useState<string[]>([]);
  const compared = businesses.filter((business) => selected.includes(business.id));

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  };

  return (
    <section className="page-section compare-page">
      <div className="catalog-heading"><div><span className="eyebrow">Side by side</span><h1>Compare local businesses</h1><p>Review practical differences before you contact anyone.</p></div><Link href="/search">Return to search</Link></div>
      <div className="compare-picker">
        {businesses.map((business) => (
          <button type="button" className={selected.includes(business.id) ? "selected" : ""} onClick={() => toggle(business.id)} key={business.id}>
            <span>{business.logoText}</span><div><strong>{business.name}</strong><small>{business.subcategory}</small></div>{selected.includes(business.id) ? <X size={14} /> : <Plus size={14} />}
          </button>
        ))}
      </div>
      <p className="compare-limit">{selected.length}/3 selected · Remove one before adding another.</p>
      {compared.length ? <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead><tr><th>Business</th>{compared.map((business) => <th key={business.id}><span>{business.logoText}</span><Link href={`/business/${business.slug}`}>{business.name}</Link>{business.verified && <BadgeCheck size={15} />}</th>)}</tr></thead>
          <tbody>
            <tr><th>Rating</th>{compared.map((business) => <td key={business.id}><strong><Star size={14} fill="currentColor" /> {business.rating}</strong><small>{business.reviewCount} reviews</small></td>)}</tr>
            <tr><th>Location</th>{compared.map((business) => <td key={business.id}><strong><MapPin size={14} /> {business.locality}</strong><small>{business.city}{business.distanceKm !== undefined ? ` · ${business.distanceKm} km` : ""}</small></td>)}</tr>
            <tr><th>Response</th>{compared.map((business) => <td key={business.id}><strong>{business.responseTime}</strong></td>)}</tr>
            <tr><th>Experience</th>{compared.map((business) => <td key={business.id}><strong>{business.yearsInBusiness} years</strong></td>)}</tr>
            <tr><th>Price range</th>{compared.map((business) => <td key={business.id}><strong>{business.priceRange}</strong></td>)}</tr>
            <tr><th>Home service</th>{compared.map((business) => <td key={business.id}>{business.services.some((service) => service.homeService) ? <span className="compare-yes"><Check size={14} /> Available</span> : "At business only"}</td>)}</tr>
            <tr><th>Languages</th>{compared.map((business) => <td key={business.id}>{business.languages.join(", ")}</td>)}</tr>
            <tr><th>Next step</th>{compared.map((business) => <td key={business.id}><Link className="compare-contact" href={`/business/${business.slug}#enquiry`}>View &amp; enquire</Link></td>)}</tr>
          </tbody>
        </table>
      </div> : <div className="empty-state"><Plus size={30} /><h2>No businesses to compare</h2><p>Published backend records will be available for comparison here.</p><Link href="/businesses">Browse businesses</Link></div>}
    </section>
  );
}
