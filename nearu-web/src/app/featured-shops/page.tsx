import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Images, MapPin, Star } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { getCatalogData } from "@/lib/catalog";
import { imageForBusiness, itemsForFeaturedBusiness } from "@/lib/featured-shops";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Featured Shops"),
  description: "Browse featured Nearu shops with item photos, ratings, categories, and local business highlights.",
  alternates: { canonical: "/featured-shops" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Featured Shops"),
    description: "Browse featured Nearu shops with item photos, ratings, categories, and local business highlights.",
    url: absoluteUrl("/featured-shops"),
    images: [{ url: absoluteUrl("/mockup/im-supermarket.jpg"), width: 1200, height: 630, alt: "Featured Nearu shops" }],
  }),
};

export default async function FeaturedShopsPage() {
  const data = await getCatalogData({ featured: true, limit: 24 });
  const shops = data.all ?? data.featured;

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
            <h1 className="mt-2 max-w-[820px] text-[40px] font-black leading-[0.98] sm:text-[62px]">Featured shops</h1>
            <p className="mt-4 max-w-[720px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">
              Explore highlighted businesses with shop photos, featured item previews, ratings, and quick local context.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        {shops.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cbd7ea] bg-white px-5 py-12 text-center">
            <h2 className="text-[22px] font-black">No featured shops yet</h2>
            <p className="mt-2 text-[13px] font-semibold text-[#596a82]">Featured businesses will appear here when they are marked in admin.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => {
              const items = itemsForFeaturedBusiness(shop);

              return (
                <Link
                  key={shop.slug}
                  href={`/featured-shops/${shop.slug}`}
                  className="overflow-hidden rounded-[18px] border border-[#dfe6f2] bg-white shadow-[0_14px_32px_rgba(11,47,116,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(11,47,116,0.10)]"
                >
                  <div className="relative h-[210px] bg-slate-100">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageForBusiness(shop)})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/8 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[12px] font-black text-white" style={{ backgroundColor: shop.badge.color ?? "#2469d6" }}>
                      {shop.badge.text ?? "Featured"}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[12px] font-black uppercase tracking-[0.08em] text-white/78">{shop.category.name}</p>
                      <h2 className="mt-1 text-[23px] font-black leading-tight">{shop.name}</h2>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-6 text-[#596a82]">{shop.description || shop.subtitle}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-[#0b2f74]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1.5">
                        <Star className="h-3.5 w-3.5 fill-[#f5b625] text-[#f5b625]" />
                        {shop.rating.score.toFixed(1)} ({shop.rating.reviewCount})
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-1.5">
                        <Images className="h-3.5 w-3.5" />
                        {items.length} item photos
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {shop.location.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {items.map((item) => (
                        <div key={item.name} className="aspect-square overflow-hidden rounded-[12px] bg-[#f2f5fb]">
                          <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-black text-[#0b2f74]">
                      View shop showcase
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
