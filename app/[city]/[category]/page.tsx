import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BusinessCard } from "@/components/business-card";
import { PortalHero } from "@/components/portal-hero";
import { cities } from "@/lib/catalog-data";
import { getPublicBusinesses, getPublicCategories } from "@/lib/public-api";

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string; category: string }> }): Promise<Metadata> {
  const value = await params;
  const city = cities.find((item) => slug(item.name) === value.city);
  const categories = await getPublicCategories();
  const category = categories.find((item) => item.slug === value.category);
  if (!city || !category) return {};
  return {
    title: `${category.name} in ${city.name}`,
    description: `Compare trusted ${category.name.toLowerCase()} in ${city.name}, Kerala with ratings, distance and direct enquiry options.`,
    alternates: { canonical: `/${value.city}/${value.category}` },
  };
}

export default async function CategoryLocationPage({ params }: { params: Promise<{ city: string; category: string }> }) {
  const value = await params;
  const city = cities.find((item) => slug(item.name) === value.city);
  const categories = await getPublicCategories();
  const category = categories.find((item) => item.slug === value.category);
  if (!city || !category) notFound();
  const results = await getPublicBusinesses({ city: city.name, category: category.slug });

  return (
    <AppShell>
      <PortalHero
        prelude={<nav className="portal-hero-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} /><Link href={`/${value.city}`}>{city.name}</Link><ChevronRight size={13} /><span>{category.name}</span></nav>}
        eyebrow={`${city.district} district · Curated category`}
        title={<>{category.name} <em>in {city.name}.</em></>}
        description="Compare local profiles, reviews, availability and direct enquiry options in one clear view."
        image={results[0]?.coverImage}
        imageAlt={results[0] ? `${results[0].name}, ${category.name} in ${city.name}` : `${category.name} in ${city.name}`}
        tone="city-discovery-hero"
        mediaLabel={`${results.length} places to begin`}
      >
        <Link className="portal-hero-action" href={`/search?q=${encodeURIComponent(category.name)}&location=${encodeURIComponent(city.name)}&radius=50`}>Search all matches</Link>
      </PortalHero>
      <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow">Local directory</span><h2>{results.length} published places</h2><p>Listings matching both this city and category.</p></div></div>
        {results.length ? <div className="business-grid">{results.map((business) => <BusinessCard business={business} key={business.id} />)}</div> : <div className="empty-state"><h2>No listings published here yet</h2><p>Verified backend records will appear in this category.</p><Link href="/business/add">List your business</Link></div>}
      </section>
    </AppShell>
  );
}
