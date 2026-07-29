import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, Images } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { getDealsData } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Deals"),
  description: "Browse local Nearu deals with item photos, shop details, and limited-time offers.",
  alternates: { canonical: "/deals" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Deals"),
    description: "Browse local Nearu deals with item photos, shop details, and limited-time offers.",
    url: absoluteUrl("/deals"),
    images: [{ url: absoluteUrl("/mockup/im-gifts.jpg"), width: 1200, height: 630, alt: "Nearu deals" }],
  }),
};

export default function DealsPage() {
  const deals = getDealsData();

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
            <h1 className="mt-2 max-w-[760px] text-[40px] font-black leading-[0.98] sm:text-[62px]">Deals in spotlight</h1>
            <p className="mt-4 max-w-[680px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">
              Browse local offers with item photos, shop names, validity, and quick deal details.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {deals.map((deal) => (
            <Link
              key={deal.slug}
              href={`/deals/${deal.slug}`}
              className="overflow-hidden rounded-[18px] border border-[#dfe6f2] bg-white shadow-[0_14px_32px_rgba(11,47,116,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(11,47,116,0.10)]"
            >
              <div className="relative h-[190px] bg-slate-100">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${deal.image})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-black/8 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[12px] font-black text-white" style={{ backgroundColor: deal.badgeColor }}>
                  {deal.badge}
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-[12px] font-black uppercase tracking-[0.08em] text-white/78">{deal.category}</p>
                  <h2 className="mt-1 text-[22px] font-black leading-tight">{deal.title}</h2>
                </div>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-[13px] font-semibold leading-6 text-[#596a82]">{deal.text}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-[#0b2f74]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1.5">
                    <Images className="h-3.5 w-3.5" />
                    {deal.items.length} item photos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {deal.validUntil}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {deal.items.slice(0, 3).map((item) => (
                    <div key={item.name} className="aspect-square overflow-hidden rounded-[12px] bg-[#f2f5fb]">
                      <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-black text-[#0b2f74]">
                  View deal
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
