import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PortalHero } from "@/components/portal-hero";
import { businesses, cities } from "@/lib/catalog-data";

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = cities.find((item) => slug(item.name) === citySlug);
  return city ? { title: `Local offers in ${city.name}`, alternates: { canonical: `/offers/${citySlug}` } } : {};
}

export default async function CityOffersPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = cities.find((item) => slug(item.name) === citySlug);
  if (!city) notFound();
  const localOffers = businesses.filter((business) => business.city === city.name && business.offer);
  const cityBusiness = localOffers[0] ?? businesses.find((business) => business.city === city.name);

  return (
    <AppShell>
      <PortalHero
        eyebrow={`${city.name} · Local offers`}
        title={<><em>{`Offers near ${city.name}`}</em>, without the bargain-bin feeling.</>}
        description="Current promotions from nearby businesses, presented with the context you need before making contact."
        image={cityBusiness?.coverImage}
        imageAlt={cityBusiness ? `${cityBusiness.name} representing local offers in ${city.name}` : `Local offers in ${city.name}`}
        tone="offers-hero"
        mediaLabel={`${localOffers.length} current ${localOffers.length === 1 ? "offer" : "offers"} in ${city.name}`}
      />
      <section className="page-section catalog-section">
        <div className="catalog-heading">
          <div><span className="eyebrow"><MapPin size={14} /> {city.name}</span><h2>Current offers nearby</h2><p>Confirm availability and final terms directly with the business.</p></div>
          <Link href="/offers">Browse every city <ArrowRight size={15} /></Link>
        </div>
        {localOffers.length ? <div className="offers-directory-grid">{localOffers.map((business) => (
          <article key={business.id}>
            <div className="offer-directory-media">
              <Image src={business.coverImage} alt={`${business.name} offer`} fill sizes="(max-width: 620px) 100vw, 270px" />
              <strong>{business.offer?.discount}</strong>
            </div>
            <div className="offer-directory-copy">
              <span>{business.category}</span>
              <h2>{business.offer?.title}</h2>
              <strong>{business.name}</strong>
              <p>{business.offer?.description}</p>
              <div><span><MapPin size={13} /> {business.locality}, {business.city}</span></div>
            </div>
            <div className="offer-directory-action">
              <span>Ask for this offer</span>
              <Link href={`/business/${business.slug}`}>View business</Link>
            </div>
          </article>
        ))}</div> : <div className="empty-state"><Sparkles size={30} /><h2>No live offer in this city today</h2><p>Browse every Kerala offer or check back later.</p><Link href="/offers">See all offers</Link></div>}
      </section>
    </AppShell>
  );
}
