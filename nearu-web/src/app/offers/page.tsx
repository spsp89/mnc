import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, Images, Tag } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { getOffersData } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Top Offers"),
  description: "Browse today's top Nearu offers with item photos, offer codes, shop names, and local details.",
  alternates: { canonical: "/offers" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Top Offers"),
    description: "Browse today's top Nearu offers with item photos, offer codes, shop names, and local details.",
    url: absoluteUrl("/offers"),
    images: [{ url: absoluteUrl("/mockup/im-gifts.jpg"), width: 1200, height: 630, alt: "Nearu top offers" }],
  }),
};

export default function OffersPage() {
  const offers = getOffersData();

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto max-w-[1800px] px-4 py-9 sm:px-5 md:px-10">
            <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-black text-white/78 transition hover:text-white">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to marketplace
            </Link>
            <p className="mt-6 text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">BNC Marketplace</p>
            <h1 className="mt-2 max-w-[820px] text-[40px] font-black leading-[0.98] sm:text-[62px]">Today&apos;s top offers</h1>
            <p className="mt-4 max-w-[720px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">
              Open every offer as its own page with product photos, item details, offer codes, and shop context.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <Link
              key={offer.slug}
              href={`/offers/${offer.slug}`}
              className="overflow-hidden rounded-[18px] border border-[#dfe6f2] bg-white shadow-[0_14px_32px_rgba(11,47,116,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(11,47,116,0.10)]"
            >
              <div className="relative h-[200px] p-5 text-white" style={{ background: offer.gradient }}>
                <div className="relative z-10 max-w-[68%]">
                  <h2 className="text-[30px] font-black leading-none">{offer.title}</h2>
                  <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-5 text-white/86">{offer.text}</p>
                  <div className="mt-4 inline-flex rounded-[8px] bg-white/18 px-3 py-1.5 text-[11px] font-black">Use Code: {offer.code}</div>
                </div>
                <div className="absolute bottom-0 right-0 h-[170px] w-[170px] overflow-hidden rounded-tl-[28px]">
                  <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${offer.image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/12" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 text-[11px] font-black text-[#0b2f74]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {offer.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {offer.validUntil}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-1.5">
                    <Images className="h-3.5 w-3.5" />
                    {offer.items.length} item photos
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {offer.items.slice(0, 3).map((item) => (
                    <div key={item.name} className="aspect-square overflow-hidden rounded-[12px] bg-[#f2f5fb]">
                      <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[13px] font-black text-[#0b2f74]">{offer.shop}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
