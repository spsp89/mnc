import type { Metadata } from "next";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BusinessCard } from "@/components/business-card";
import { PortalHero } from "@/components/portal-hero";
import { cities } from "@/lib/catalog-data";
import { getPublicBusinesses } from "@/lib/public-api";

const slugify = (value: string) => value.toLowerCase().replace(/\s/g, "-");

export function generateStaticParams() {
  return cities.map((city) => ({ city: slugify(city.name) }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = cities.find((item) => slugify(item.name) === citySlug);
  return city ? { title: `Local businesses in ${city.name}`, description: `Discover trusted shops, services and professionals in ${city.name}, Kerala.` } : {};
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = cities.find((item) => slugify(item.name) === citySlug);
  if (!city) notFound();
  const local = await getPublicBusinesses({ city: city.name });
  return (
    <AppShell>
      <PortalHero
        eyebrow={`${city.district} district · Local directory`}
        title={<>See what&apos;s good <em>around {city.name}.</em></>}
        description={`Browse published neighbourhood services, independent shops and skilled professionals in ${city.name}.`}
        image={local[0]?.coverImage}
        imageAlt={local[0] ? `${local[0].name} in ${city.name}` : `BNC discovery in ${city.name}`}
        tone="city-discovery-hero"
        mediaLabel={`Local life in ${city.name}`}
      >
        <Link className="portal-hero-action" href={`/search?location=${encodeURIComponent(city.name)}&radius=10`}><Search size={16} /> Search {city.name}</Link>
      </PortalHero>
      <section className="page-section city-business-section">
        <div className="catalog-heading"><div><span className="eyebrow">Local profiles</span><h2>Explore {city.name}</h2></div><Link href={`/search?location=${encodeURIComponent(city.name)}`}>See search results <ArrowRight size={15} /></Link></div>
        {local.length ? <div className="business-grid">{local.map((business) => <BusinessCard business={business} key={business.id} />)}</div> : <div className="empty-state"><Search size={30} /><h2>No businesses published in {city.name} yet</h2><p>Verified backend records will appear here.</p><Link href="/business/add">List your business</Link></div>}
      </section>
    </AppShell>
  );
}
