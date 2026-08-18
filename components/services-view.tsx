"use client";

import { ArrowRight, Clock3, Home, MapPin, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { PortalHero } from "@/components/portal-hero";
import { SearchBox } from "@/components/search-box";
import type { PublicServiceListing } from "@/lib/public-api";
import type { SearchFilters } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ServicesView({ liveServices, filters }: { liveServices: PublicServiceListing[]; filters: SearchFilters }) {
  const query = filters.query ?? "";
  const heroBusiness = liveServices[0]?.business;
  const filtered = useMemo(() => liveServices.filter(({ service, business }) =>
    `${service.name} ${business.name} ${business.category}`.toLowerCase().includes(query.toLowerCase()),
  ), [liveServices, query]);

  return (
    <>
      <PortalHero
        eyebrow="Trusted local services"
        title={<><span>The right specialist,</span><em>without the runaround.</em></>}
        description="Compare clear starting prices, availability and practical service details before you make contact."
        image={heroBusiness?.coverImage}
        imageAlt={heroBusiness ? `${heroBusiness.name} local service team` : "BNC local services"}
        tone="service-directory-hero"
        mediaLabel="Skilled professionals near you"
      >
        <div className="results-hero-search">
          <SearchBox
            initialQuery={filters.query}
            initialLocation={filters.location}
            initialLatitude={filters.latitude}
            initialLongitude={filters.longitude}
            initialMode="services"
            compact
          />
        </div>
      </PortalHero>
      <section className="page-section catalog-section">
        <div className="catalog-heading">
          <div><span className="eyebrow">Available nearby</span><h2>{filtered.length} services to compare{filters.latitude !== undefined ? ` within ${filters.radius ?? 5} km` : ""}</h2></div>
          <Link href="/enquiry">Let BNC match me <ArrowRight size={16} /></Link>
        </div>
        <div className="service-directory-grid">
          {filtered.map(({ service, business, image }) => (
            <article key={service.id}>
              <Link className="service-directory-media" href={`/services/${service.id}`}>
                <Image
                  src={image}
                  alt={`${service.name} by ${business.name}`}
                  fill
                  sizes="(max-width: 680px) 92vw, (max-width: 1050px) 46vw, 30vw"
                />
                <small>{business.category}</small>
              </Link>
              <div className="service-directory-body">
                <div className="service-directory-top">
                  <h2><Link href={`/services/${service.id}`}>{service.name}</Link></h2>
                  <p>By <Link href={`/business/${business.slug}`}>{business.name}</Link></p>
                </div>
                <div className="service-directory-meta">
                  <span><MapPin size={14} /> {business.locality}, {business.city}</span>
                  {business.distanceKm !== undefined && <span><MapPin size={14} /> {business.distanceKm} km away</span>}
                  {service.duration && <span><Clock3 size={14} /> {service.duration}</span>}
                  {service.homeService && <span><Home size={14} /> Home service</span>}
                </div>
                <div className="service-directory-bottom">
                  <div><small>Starts at</small><strong>{service.startingPrice === 0 ? "Free consultation" : formatCurrency(service.startingPrice)} <em>{service.pricingUnit}</em></strong></div>
                  <Link href={`/services/${service.id}`}>View service <ArrowRight size={15} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && <div className="empty-state"><Search size={30} /><h2>No services published yet</h2><p>Services supplied by verified businesses will appear here.</p><Link href="/enquiry">Start an enquiry</Link></div>}
        <div className="directory-trust"><ShieldCheck size={20} /><div><strong>You stay in control.</strong><p>Your contact details are shared only according to the consent choices in your enquiry.</p></div></div>
      </section>
    </>
  );
}
