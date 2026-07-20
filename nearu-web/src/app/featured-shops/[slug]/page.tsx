import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ImageIcon, MapPin, Phone, Star, Store } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { getBusinessBySlug, getCatalogData, getBusinessesForSitemap } from "@/lib/catalog";
import { imageForBusiness, itemsForFeaturedBusiness } from "@/lib/featured-shops";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

type FeaturedShopDetailProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getBusinessesForSitemap()
    .filter((business) => business.flags.featured)
    .map((business) => ({ slug: business.slug }));
}

export async function generateMetadata({ params }: FeaturedShopDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return { title: pageTitle("Featured shop not found") };
  }

  return {
    title: pageTitle(`${business.name} Featured Shop`),
    description: `${business.name} is a featured ${business.category.name} business in ${business.location.area}. View item photos and shop highlights.`,
    alternates: { canonical: `/featured-shops/${business.slug}` },
    openGraph: defaultOpenGraph({
      title: pageTitle(`${business.name} Featured Shop`),
      description: `${business.name} is a featured ${business.category.name} business in ${business.location.area}.`,
      url: absoluteUrl(`/featured-shops/${business.slug}`),
      images: [{ url: absoluteUrl(imageForBusiness(business)), width: 1200, height: 630, alt: business.name }],
    }),
  };
}

export default async function FeaturedShopDetailPage({ params }: FeaturedShopDetailProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || !business.flags.featured) {
    notFound();
  }

  const items = itemsForFeaturedBusiness(business);
  const relatedData = await getCatalogData({ category: business.category.slug, limit: 4, sort: "rating" });
  const related = (relatedData.all ?? []).filter((item) => item.slug !== business.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <Link href="/featured-shops" className="inline-flex items-center gap-2 text-[12px] font-black text-white/78 transition hover:text-white">
                <ChevronRight className="h-4 w-4 rotate-180" />
                All featured shops
              </Link>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-[12px] font-black text-white" style={{ backgroundColor: business.badge.color ?? "#2469d6" }}>
                  {business.badge.text ?? "Featured"}
                </span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[12px] font-black text-white/86">{business.category.name}</span>
              </div>
              <h1 className="mt-4 max-w-[820px] text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[72px]">{business.name}</h1>
              <p className="mt-4 max-w-[660px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">{business.description || business.subtitle}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-[12px] font-black text-white/84">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Star className="h-4 w-4 fill-[#f5b625] text-[#f5b625]" />
                  {business.rating.score.toFixed(1)} rating
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <MapPin className="h-4 w-4 text-[#f5b625]" />
                  {business.location.area}, {business.location.city}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <ImageIcon className="h-4 w-4 text-[#f5b625]" />
                  {items.length} photos
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[1.25fr_0.75fr] gap-3">
              <div className="min-h-[280px] overflow-hidden rounded-[20px] border border-white/16 bg-white/10 p-2">
                <div className="h-full min-h-[260px] rounded-[15px] bg-cover bg-center" style={{ backgroundImage: `url(${imageForBusiness(business)})` }} />
              </div>
              <div className="grid gap-3">
                {items.slice(0, 2).map((item) => (
                  <div key={item.name} className="min-h-[130px] overflow-hidden rounded-[18px] border border-white/16 bg-white/10 p-2">
                    <div className="h-full min-h-[116px] rounded-[13px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="text-[26px] font-black leading-tight sm:text-[34px]">Shop items and highlights</h2>
            <p className="mt-2 max-w-[620px] text-[13px] font-semibold leading-6 text-[#596a82]">
              A quick visual showcase of what customers can find at this featured business.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item.name} className="overflow-hidden rounded-[18px] border border-[#dfe6f2] bg-white shadow-[0_14px_32px_rgba(11,47,116,0.07)]">
                  <div className="h-[230px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="p-5">
                    <span className="inline-flex rounded-full bg-[#fff4d6] px-3 py-1.5 text-[11px] font-black text-[#0b2f74]">{item.label}</span>
                    <h3 className="mt-4 text-[20px] font-black leading-tight">{item.name}</h3>
                    <p className="mt-2 text-[13px] font-semibold leading-6 text-[#596a82]">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[18px] border border-[#dfe6f2] bg-white p-5 shadow-[0_14px_32px_rgba(11,47,116,0.07)]">
              <h2 className="text-[20px] font-black">Contact</h2>
              <div className="mt-4 space-y-3 text-[13px] font-semibold text-[#596a82]">
                <p className="flex gap-2"><Store className="h-4 w-4 text-[#0b2f74]" /> {business.category.name}</p>
                <p className="flex gap-2"><MapPin className="h-4 w-4 text-[#0b2f74]" /> {business.location.addressLine || business.location.area}</p>
                {business.contact.phone ? <p className="flex gap-2"><Phone className="h-4 w-4 text-[#0b2f74]" /> {business.contact.phone}</p> : null}
              </div>
              <Link href={`/business/${business.slug}`} className="mt-5 inline-flex w-full justify-center rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f]">
                Open full business page
              </Link>
            </div>

            {related.length > 0 ? (
              <div className="rounded-[18px] border border-[#dfe6f2] bg-white p-5 shadow-[0_14px_32px_rgba(11,47,116,0.07)]">
                <h2 className="text-[20px] font-black">More in {business.category.name}</h2>
                <div className="mt-4 space-y-3">
                  {related.map((item) => (
                    <Link key={item.slug} href={`/business/${item.slug}`} className="block rounded-[14px] bg-[#f6f8fc] p-3">
                      <p className="font-black">{item.name}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#596a82]">{item.location.area} · {item.rating.score.toFixed(1)} rating</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
