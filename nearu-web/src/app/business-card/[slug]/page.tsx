import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock3, MapPin, MessageCircle, Phone, QrCode, Share2, Star, WalletCards } from "lucide-react";

import { AnalyticsLink, AnalyticsView } from "@/components/nearu/analytics-tracker";
import { SiteHeader } from "@/components/nearu/site-header";
import { getBusinessBySlug } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, imageForMeta, pageTitle } from "@/lib/seo";

type BusinessCardProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return { title: pageTitle("Business Card Not Found"), robots: { index: false, follow: false } };
  }

  const canonical = `/business-card/${business.slug}`;
  const image = business.images.find((item) => item.role === "cover") ?? business.images[0];

  return {
    title: pageTitle(`${business.name} Business Card`),
    description: `Digital business card for ${business.name} with contact, directions, UPI, gallery, and verified local details.`,
    alternates: { canonical },
    openGraph: defaultOpenGraph({
      title: pageTitle(`${business.name} Business Card`),
      description: `Call, WhatsApp, route, and pay ${business.name} through its BNC Nearu business card.`,
      url: absoluteUrl(canonical),
      images: [{ url: imageForMeta(image?.url), width: 1200, height: 630, alt: business.name }],
    }),
  };
}

export default async function BusinessCardDetailPage({ params }: BusinessCardProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const phoneHref = business.contact.phone ? `tel:${business.contact.phone.replace(/\s+/g, "")}` : "";
  const whatsappHref = business.contact.whatsapp ? `https://wa.me/${business.contact.whatsapp.replace(/\D/g, "")}` : "";
  const mapQuery = [business.name, business.location.addressLine, business.location.area, business.location.city].filter(Boolean).join(", ");
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const cardUrl = absoluteUrl(`/business-card/${business.slug}`);
  const cover = business.gallery[0] ?? business.images[0]?.url ?? "/mockup/im-card_banner.jpg";
  const upiHref = business.payment.upiId
    ? `upi://pay?pa=${encodeURIComponent(business.payment.upiId)}&pn=${encodeURIComponent(business.name)}`
    : "";

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <AnalyticsView businessSlug={business.slug} eventType="business_card_view" source="business_card_page" />
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <Link href={`/business/${business.slug}`} className="text-[12px] font-black text-white/78 hover:text-white">
              Open full profile
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              {business.trust.verified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black">
                  <BadgeCheck className="h-4 w-4 text-[#f5b625]" />
                  Verified
                </span>
              ) : null}
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black">{business.category.name}</span>
            </div>
            <h1 className="mt-3 max-w-[820px] text-[40px] font-black leading-none sm:text-[62px]">{business.name}</h1>
            <p className="mt-4 max-w-[680px] text-[16px] font-semibold leading-7 text-white/82">
              {business.description || business.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {phoneHref ? <AnalyticsLink businessSlug={business.slug} eventType="call_click" source="business_card_page" href={phoneHref} className="inline-flex items-center gap-2 rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f]"><Phone className="h-4 w-4" />Call</AnalyticsLink> : null}
              {whatsappHref ? <AnalyticsLink businessSlug={business.slug} eventType="whatsapp_click" source="business_card_page" href={whatsappHref} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white"><MessageCircle className="h-4 w-4" />WhatsApp</AnalyticsLink> : null}
              <AnalyticsLink businessSlug={business.slug} eventType="route_click" source="business_card_page" href={directionsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white"><MapPin className="h-4 w-4" />Route</AnalyticsLink>
              {upiHref ? <AnalyticsLink businessSlug={business.slug} eventType="payment_click" source="business_card_page" href={upiHref} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white"><WalletCards className="h-4 w-4" />UPI</AnalyticsLink> : null}
              <AnalyticsLink businessSlug={business.slug} eventType="business_card_share_click" source="business_card_page" href={cardUrl} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white"><Share2 className="h-4 w-4" />Share</AnalyticsLink>
            </div>
          </div>
          <article className="overflow-hidden rounded-[18px] border border-white/18 bg-white text-[#0b2f74] shadow-[0_26px_64px_rgba(0,0,0,0.28)]">
            <div className="h-[190px] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(0deg,rgba(6,31,85,0.20),rgba(6,31,85,0.02)),url(${cover})` }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[27px] font-black leading-tight">{business.name}</h2>
                  <p className="mt-1 text-[13px] font-bold text-[#596a82]">{business.subtitle}</p>
                </div>
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[12px] border border-[#dfe6f2] bg-[#f8fafc]">
                  <QrCode className="h-12 w-12" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Info label="Rating" value={`${business.rating.score.toFixed(1)} (${business.rating.reviewCount})`} icon={<Star className="h-4 w-4" />} />
                <Info label="Hours" value={business.hours || "Not updated"} icon={<Clock3 className="h-4 w-4" />} />
                <Info label="UPI" value={business.payment.upiId || "Ask business"} icon={<WalletCards className="h-4 w-4" />} />
                <Info label="Share" value={cardUrl.replace(/^https?:\/\//, "")} icon={<Share2 className="h-4 w-4" />} />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#dfe6f2] bg-[#f8fafc] p-3">
      <div className="flex items-center gap-2 text-[#bd7600]">{icon}<span className="text-[11px] font-black uppercase tracking-[0.08em]">{label}</span></div>
      <p className="mt-1 truncate text-[13px] font-black text-[#0b2f74]">{value}</p>
    </div>
  );
}
