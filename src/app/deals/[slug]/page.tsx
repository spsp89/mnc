import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, ImageIcon, Store, Tag } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { getDealBySlugData, getDealsData } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

type DealDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getDealsData().map((deal) => ({ slug: deal.slug }));
}

export async function generateMetadata({ params }: DealDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = getDealBySlugData(slug);

  if (!deal) {
    return { title: pageTitle("Deal not found") };
  }

  return {
    title: pageTitle(deal.title),
    description: `${deal.title} from ${deal.shop}. ${deal.text}`,
    alternates: { canonical: `/deals/${deal.slug}` },
    openGraph: defaultOpenGraph({
      title: pageTitle(deal.title),
      description: `${deal.title} from ${deal.shop}. ${deal.text}`,
      url: absoluteUrl(`/deals/${deal.slug}`),
      images: [{ url: absoluteUrl(deal.image), width: 1200, height: 630, alt: deal.title }],
    }),
  };
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { slug } = await params;
  const deal = getDealBySlugData(slug);

  if (!deal) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <Link href="/deals" className="inline-flex items-center gap-2 text-[12px] font-black text-white/78 transition hover:text-white">
                <ChevronRight className="h-4 w-4 rotate-180" />
                All deals
              </Link>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-[12px] font-black text-white" style={{ backgroundColor: deal.badgeColor }}>
                  {deal.badge}
                </span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[12px] font-black text-white/86">{deal.category}</span>
              </div>
              <h1 className="mt-4 max-w-[820px] text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[72px]">{deal.title}</h1>
              <p className="mt-4 max-w-[660px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">{deal.text}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-[12px] font-black text-white/84">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Store className="h-4 w-4 text-[#f5b625]" />
                  {deal.shop}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Clock className="h-4 w-4 text-[#f5b625]" />
                  {deal.validUntil}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <ImageIcon className="h-4 w-4 text-[#f5b625]" />
                  {deal.items.length} photos
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[1.25fr_0.75fr] gap-3">
              <div className="min-h-[280px] overflow-hidden rounded-[20px] border border-white/16 bg-white/10 p-2">
                <div className="h-full min-h-[260px] rounded-[15px] bg-cover bg-center" style={{ backgroundImage: `url(${deal.image})` }} />
              </div>
              <div className="grid gap-3">
                {deal.items.slice(0, 2).map((item) => (
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-black leading-tight sm:text-[34px]">Items in this deal</h2>
            <p className="mt-2 max-w-[620px] text-[13px] font-semibold leading-6 text-[#596a82]">
              Each item includes a photo, short description, and offer label for easier browsing.
            </p>
          </div>
          <Link href="/" className="inline-flex w-fit rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f]">
            Browse marketplace
          </Link>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {deal.items.map((item) => (
            <article key={item.name} className="overflow-hidden rounded-[18px] border border-[#dfe6f2] bg-white shadow-[0_14px_32px_rgba(11,47,116,0.07)]">
              <div className="h-[230px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
              <div className="p-5">
                {item.price ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1.5 text-[11px] font-black text-[#0b2f74]">
                    <Tag className="h-3.5 w-3.5" />
                    {item.price}
                  </span>
                ) : null}
                <h3 className="mt-4 text-[20px] font-black leading-tight">{item.name}</h3>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-[#596a82]">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
