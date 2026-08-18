"use client";

import { Bookmark, Clock3, Package, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { BusinessCard } from "@/components/business-card";
import { formatCurrency } from "@/lib/utils";
import type { CustomerPortalData } from "@/lib/portal-data";

export function SavedView({ data }: { data: CustomerPortalData }) {
  const [saved, setSaved] = useState(data.savedBusinesses);
  const [savedProducts, setSavedProducts] = useState(data.savedProducts);
  const [tab, setTab] = useState<"businesses" | "products" | "recent">("businesses");

  return (
    <section className="page-section personal-list-page">
      <div className="catalog-heading">
        <div><span className="eyebrow">Your shortlist</span><h1>Saved &amp; recent</h1><p>Keep useful businesses and products together while you decide.</p></div>
        {tab === "businesses" && saved.length > 0 && <button type="button" onClick={() => setSaved([])}>Clear businesses</button>}
      </div>
      <div className="catalog-tabs" role="tablist" aria-label="Saved items">
        <button type="button" className={tab === "businesses" ? "active" : ""} onClick={() => setTab("businesses")}><Bookmark size={15} /> Businesses</button>
        <button type="button" className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><Package size={15} /> Products</button>
        <button type="button" className={tab === "recent" ? "active" : ""} onClick={() => setTab("recent")}><Clock3 size={15} /> Recently viewed</button>
      </div>
      {tab === "businesses" && (saved.length ? (
        <>
          <div className="business-grid">{saved.map((business) => <BusinessCard business={business} key={business.id} />)}</div>
          <p>These businesses are synced from your BNC account.</p>
        </>
      ) : (
        <div className="empty-state"><Bookmark size={30} /><h2>Your shortlist is empty</h2><p>Save useful profiles as you explore and they will appear here.</p><Link href="/search"><Search size={15} /> Explore nearby businesses</Link></div>
      ))}
      {tab === "products" && (savedProducts.length ? (
        <div className="product-grid">{savedProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 100vw, 33vw" /></div>
            <div><small>{product.category}</small><h2><Link href={`/products/${product.id}`}>{product.name}</Link></h2><strong>{formatCurrency(product.discountPrice ?? product.price)}</strong><button type="button" onClick={() => setSavedProducts((items) => items.filter((item) => item.id !== product.id))}>Remove</button></div>
          </article>
        ))}</div>
      ) : <div className="empty-state"><Package size={30} /><h2>No saved products</h2><p>Save marketplace items to compare them here.</p><Link href="/products">Browse products</Link></div>)}
      {tab === "recent" && (data.recentBusinesses.length ? (
        <div className="business-grid">{data.recentBusinesses.map((business) => <BusinessCard business={business} key={business.id} />)}</div>
      ) : <div className="empty-state"><Clock3 size={30} /><h2>No recently viewed businesses</h2><p>Businesses you view will appear here.</p></div>)}
    </section>
  );
}
