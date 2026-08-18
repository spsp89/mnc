import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock3, Home, MapPin, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BncMessageButton } from "@/components/bnc-message-button";
import { WhatsAppInquiryButton } from "@/components/whatsapp-inquiry-button";
import { getPublicService, getPublicServices } from "@/lib/public-api";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await getPublicService(id);
  if (!match) return {};
  return {
    title: `${match.service.name} in ${match.business.city}`,
    description: `Compare pricing and request ${match.service.name.toLowerCase()} from ${match.business.name}.`,
    alternates: { canonical: `/services/${match.service.id}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, allServices] = await Promise.all([
    getPublicService(id),
    getPublicServices(),
  ]);
  if (!match) notFound();
  const { service, business } = match;
  const price = service.startingPrice === 0 ? "Free consultation" : formatCurrency(service.startingPrice);

  return (
    <AppShell headerVariant="immersive">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.name,
            provider: { "@type": "LocalBusiness", name: business.name, url: `/business/${business.slug}` },
            areaServed: `${business.city}, Kerala`,
            offers: service.startingPrice > 0
              ? { "@type": "Offer", priceCurrency: "INR", price: service.startingPrice }
              : undefined,
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div className="service-detail-page">
          <div className="service-detail-grid">
          <div className="service-detail-image">
            <Image src={business.coverImage} alt={`${service.name} by ${business.name}`} fill priority sizes="(max-width: 850px) 100vw, 47vw" />
          </div>
          <section>
            <Link className="back-link" href="/services"><ArrowLeft size={15} /> Back to all services</Link>
            <span className="eyebrow">{business.category}</span>
            <h1>{service.name}</h1>
            <p className="service-provider">By <Link href={`/business/${business.slug}`}>{business.name}</Link></p>
            <div className="service-detail-price"><small>Starting price</small><strong>{price}</strong><span>{service.pricingUnit}</span></div>
            <p>
              Request this service directly from {business.name}. Share the scope, preferred date and location;
              the business can confirm availability and a final written estimate before work begins.
            </p>
            <div className="service-detail-facts">
              <span><MapPin size={17} /> {business.locality}, {business.city}</span>
              {service.duration && <span><Clock3 size={17} /> Typical duration: {service.duration}</span>}
              <span><Home size={17} /> {service.homeService ? "Home service available" : "Available at the business"}</span>
              <span><Star size={17} /> {business.rating} from {business.reviewCount} reviews</span>
            </div>
            <div className="service-detail-actions">
              <Link href={`/business/${business.slug}#enquiry`}>Request a quote</Link>
              <WhatsAppInquiryButton phone={business.whatsapp} recipientName={business.name} message={`Hi ${business.name}, I found your ${service.name} service on BNC. Please share availability and a quote.`} />
              <BncMessageButton businessId={business.id} businessName={business.name} initialMessage={`Hi, I would like to ask about ${service.name}.`} label="Ask in BNC chat" />
            </div>
            <aside><ShieldCheck size={18} /><p>Contact details are shared only according to the consent choices shown when you submit an enquiry.</p></aside>
          </section>
        </div>
        <section className="detail-related-section">
          <div className="detail-related-heading">
            <div><span className="eyebrow">Compare nearby</span><h2>More services worth considering</h2></div>
            <Link href="/services">Browse all services</Link>
          </div>
          <div className="detail-related-grid">
            {allServices.filter(({ service: item }) => item.id !== service.id).slice(0, 6).map(({ service: item, business: provider, image }) => {
              const relatedPrice = item.startingPrice === 0 ? "Free consultation" : formatCurrency(item.startingPrice);
              return (
                <Link className="detail-related-card" href={`/services/${item.id}`} key={item.id}>
                  <div className="detail-related-media">
                    <Image src={image} alt={`${item.name} by ${provider.name}`} fill sizes="(max-width: 620px) 76vw, 25vw" />
                    <span><MapPin size={14} /> {provider.locality}</span>
                  </div>
                  <div className="detail-related-copy">
                    <span>{provider.category}</span>
                    <h3>{item.name}</h3>
                    <p>{provider.name}</p>
                    <div><strong>{relatedPrice}</strong><span>View service <ArrowRight size={15} /></span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
