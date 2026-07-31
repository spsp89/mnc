import type { Metadata } from "next";
import Link from "next/link";
import MarketingPage from "@/app/_components/marketing-page";
import { services } from "@/app/_data/services";

export const metadata: Metadata = {
  title: "Brand Strategy Services | Misbah Salam",
  description:
    "Explore brand strategy, leadership advisory and mentorship services for ambitious founders and leadership teams.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <MarketingPage
      eyebrow="Services"
      title="Strategic support for brands at defining moments."
      intro="Choose a focused engagement for a specific challenge or an ongoing advisory relationship for sustained direction."
    >
      <section className="inner-card-grid">
        {Object.entries(services).map(([slug, service]) => (
          <article className="inner-card" key={slug}>
            <p className="inner-card__number">0{Object.keys(services).indexOf(slug) + 1}</p>
            <h2>{service.title}</h2>
            <p>{service.summary}</p>
            <Link
              href={`/services/${slug}`}
              data-analytics-event="service_detail_click"
              data-analytics-location="services_index"
              data-analytics-label={slug}
            >
              Explore this service
            </Link>
          </article>
        ))}
      </section>
    </MarketingPage>
  );
}
