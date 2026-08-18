import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, MapPin, Navigation, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PortalHero } from "@/components/portal-hero";
import { cities } from "@/lib/catalog-data";
import { getPublicBusinesses } from "@/lib/public-api";

export const metadata: Metadata = { title: "BNC locations", description: "Browse local businesses by city across Kerala." };

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const businesses = await getPublicBusinesses();
  return (
    <AppShell>
      <PortalHero
        eyebrow="Kerala, locality by locality"
        title={<>A local portal shaped around <em>where life happens.</em></>}
        description="Move from city to neighbourhood context, then compare trusted places with distance, availability and direct contact in view."
        image={businesses[0]?.coverImage}
        imageAlt="A local Kerala business representing BNC city discovery"
        tone="locations-portal-hero"
        mediaLabel="Discovery grounded in place"
      >
        <div className="catalog-hero-proof">
          <span><Navigation size={15} /> Distance-aware discovery</span>
          <span><ShieldCheck size={15} /> Useful trust signals</span>
        </div>
      </PortalHero>
      <section className="page-section locations-page-grid">
        {cities.map((city, index) => {
          const cityBusiness = businesses.find((business) => business.city === city.name);
          return (
            <Link className="location-portal-card" href={`/${city.name.toLowerCase().replace(/\s/g, "-")}`} key={city.name}>
              <div className="location-card-media">
                {cityBusiness?.coverImage ? <Image src={cityBusiness.coverImage} alt={`${city.name} local business discovery`} fill sizes="(max-width: 680px) 100vw, 50vw" /> : <span className="location-card-placeholder"><MapPin size={28} /></span>}
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="location-card-copy">
                <small><MapPin size={14} /> {city.district} district</small>
                <h2>{city.name}</h2>
                <p>Discover neighbourhood businesses, practical services and people worth knowing nearby.</p>
                <span>{city.count} <ArrowRight size={15} /></span>
              </div>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
