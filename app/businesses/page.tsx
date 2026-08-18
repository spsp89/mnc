import type { Metadata } from "next";
import { ArrowRight, Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BusinessCard } from "@/components/business-card";
import { PortalHero } from "@/components/portal-hero";
import { cities } from "@/lib/catalog-data";
import { getPublicBusinesses, getPublicCategories } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Browse local businesses across Kerala",
  description: "Explore trusted shops, professionals, stays and services across Kerala.",
};

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const [businesses, categories] = await Promise.all([
    getPublicBusinesses(),
    getPublicCategories(),
  ]);
  const verifiedBusinessCount = businesses.filter((business) => business.verified).length;
  const businessCityCount = new Set(businesses.map((business) => business.city)).size;
  const categoryBusinessCounts = new Map(
    categories.map((category) => [
      category.slug,
      businesses.filter((business) => business.categorySlug === category.slug).length,
    ]),
  );
  return (
    <AppShell>
      <PortalHero
        eyebrow="BNC business directory"
        title={<>Real local businesses, <em>ready to compare.</em></>}
        description="Browse complete profiles across Kerala, then compare availability, reputation, services and direct contact details."
        image={businesses[1]?.coverImage}
        imageAlt={businesses[1] ? `${businesses[1].name}, one of the businesses listed on BNC` : "BNC business directory"}
        tone="search-results-hero"
        mediaLabel={`${businesses.length} published profiles`}
      >
        <div className="businesses-directory-stats">
          <span><Building2 size={17} /><strong>{businesses.length}</strong> businesses</span>
          <span><MapPin size={17} /><strong>{businessCityCount}</strong> cities</span>
          <span><ShieldCheck size={17} /><strong>{verifiedBusinessCount}</strong> verified</span>
        </div>
        <Link className="portal-hero-action" href="/search">
          <Search size={16} /> Search and filter
        </Link>
      </PortalHero>

      <section className="page-section businesses-directory-page">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">Browse every listing</span>
            <h1>{businesses.length} businesses across Kerala</h1>
            <p>Live fictional demo profiles from every marketplace category are available for production-flow testing.</p>
          </div>
          <Link href="/categories">Browse categories <ArrowRight size={16} /></Link>
        </div>

        <nav className="businesses-category-links" aria-label="Business categories">
          {categories.map((category) => (
            <Link href={`/search?q=${encodeURIComponent(category.name)}&radius=50`} key={category.id}>
              {category.name}
              <span>{categoryBusinessCounts.get(category.slug) ?? 0}</span>
            </Link>
          ))}
        </nav>

        {businesses.length ? <div className="business-grid">
          {businesses.map((business) => <BusinessCard business={business} key={business.id} />)}
        </div> : <div className="empty-state"><Building2 size={30} /><h2>No businesses published yet</h2><p>The directory is ready for verified backend records.</p><Link href="/business/add">List your business</Link></div>}

        <div className="businesses-city-links">
          <strong>Explore by city</strong>
          {cities.map((city) => (
            <Link href={`/${city.name.toLowerCase().replace(/\s+/g, "-")}`} key={city.name}>
              {city.name}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
