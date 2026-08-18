import type { Metadata } from "next";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BusinessCard } from "@/components/business-card";
import { CategoryCard } from "@/components/category-card";
import { PortalHero } from "@/components/portal-hero";
import { getPublicBusinesses, getPublicCategories } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Browse local business categories",
  description: "Explore trusted local businesses and services across Kerala by category.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [businesses, categories] = await Promise.all([
    getPublicBusinesses(),
    getPublicCategories(),
  ]);
  return (
    <AppShell>
      <PortalHero
        eyebrow="Explore BNC"
        title={<>Everything local, <em>organised around real life.</em></>}
        description="Browse complete profiles, compare practical details and move from discovery to direct contact."
        image={businesses[2]?.coverImage}
        imageAlt={businesses[2] ? `${businesses[2].name} representing local BNC categories` : "BNC business categories"}
        tone="catalog-hero-sage"
        mediaLabel="One portal for local life"
      >
        <div className="catalog-hero-proof">
          <span><MapPin size={15} /> Distance-aware results</span>
          <span><ShieldCheck size={15} /> Verified profile signals</span>
        </div>
      </PortalHero>
      <section className="page-section catalog-section">
        {categories.length ? (
          <div className="category-grid category-directory-grid">
            {categories.map((category) => <CategoryCard category={category} key={category.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <ShieldCheck size={30} />
            <h2>No categories published yet</h2>
            <p>Live categories will appear here when the catalogue API is available.</p>
          </div>
        )}
      </section>
      <section className="page-section catalog-feature-block">
        <div className="catalog-heading">
          <div><span className="eyebrow">Popular right now</span><h2>Businesses people are comparing</h2></div>
          <Link href="/businesses">See every business <ArrowRight size={16} /></Link>
        </div>
        {businesses.length ? <div className="business-grid">
          {businesses.slice(0, 3).map((business) => <BusinessCard business={business} key={business.id} />)}
        </div> : <div className="empty-state"><ShieldCheck size={30} /><h2>No businesses published yet</h2><p>Verified profiles will appear here when catalogue data is available.</p></div>}
      </section>
    </AppShell>
  );
}
