import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ImageIcon, Search, Store, Tag } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { getCatalogData, getCategoriesData } from "@/lib/catalog";
import { categoryItemGroups, getCategoryItem, getCategoryItems } from "@/lib/category-items";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

type CategoryItemPageProps = {
  params: Promise<{
    slug: string;
    itemSlug: string;
  }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return categoryItemGroups.flatMap((group) =>
    group.items.map((item) => ({
      slug: group.categorySlug,
      itemSlug: item.slug,
    })),
  );
}

export async function generateMetadata({ params }: CategoryItemPageProps): Promise<Metadata> {
  const { slug, itemSlug } = await params;
  const item = getCategoryItem(slug, itemSlug);
  const category = getCategoriesData().find((entry) => entry.slug === slug);

  if (!item) {
    return { title: pageTitle("Category item not found") };
  }

  const categoryName = category?.name ?? titleFromSlug(slug);
  const title = `${item.name} in ${categoryName}`;
  const description = `${item.text} Browse related ${categoryName.toLowerCase()} businesses, photos, and highlights on Nearu.`;

  return {
    title: pageTitle(title),
    description,
    alternates: { canonical: `/category/${slug}/${item.slug}` },
    openGraph: defaultOpenGraph({
      title: pageTitle(title),
      description,
      url: absoluteUrl(`/category/${slug}/${item.slug}`),
      images: [{ url: absoluteUrl(item.image), width: 1200, height: 630, alt: item.name }],
    }),
  };
}

export default async function CategoryItemPage({ params }: CategoryItemPageProps) {
  const { slug, itemSlug } = await params;
  const item = getCategoryItem(slug, itemSlug);
  const category = getCategoriesData().find((entry) => entry.slug === slug) ?? null;

  if (!item) {
    notFound();
  }

  const categoryName = category?.name ?? titleFromSlug(slug);
  const siblingItems = getCategoryItems(slug).filter((entry) => entry.slug !== item.slug).slice(0, 4);
  const relatedData = await getCatalogData({
    category: slug,
    query: item.name,
    limit: 6,
    sort: "rating",
  });
  const fallbackData = relatedData.all?.length
    ? relatedData
    : await getCatalogData({ category: slug, limit: 6, sort: "rating" });
  const relatedBusinesses = fallbackData.all ?? [];

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="bg-[radial-gradient(circle_at_18%_12%,#164caa,#082d75_48%,#061f55_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <div>
              <Link href={`/category/${slug}`} className="inline-flex items-center gap-2 text-[12px] font-black text-white/78 transition hover:text-white">
                <ChevronRight className="h-4 w-4 rotate-180" />
                {categoryName}
              </Link>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f5b625] px-3 py-1 text-[12px] font-black text-[#08285f]">{item.badge}</span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[12px] font-black text-white/86">{categoryName}</span>
              </div>
              <h1 className="mt-4 max-w-[820px] text-[38px] font-black leading-[0.98] sm:text-[58px] lg:text-[72px]">{item.name}</h1>
              <p className="mt-4 max-w-[660px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">{item.text}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-[12px] font-black text-white/84">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <ImageIcon className="h-4 w-4 text-[#f5b625]" />
                  Photo page
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Store className="h-4 w-4 text-[#f5b625]" />
                  {relatedBusinesses.length} related listings
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Search className="h-4 w-4 text-[#f5b625]" />
                  Browse by item
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-white/16 bg-white/10 p-3 shadow-[0_24px_55px_rgba(0,0,0,0.24)]">
              <div className="min-h-[300px] rounded-[16px] bg-cover bg-center sm:min-h-[390px]" style={{ backgroundImage: `url(${item.image})` }} />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1800px] gap-6 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="text-[26px] font-black leading-tight sm:text-[34px]">What you can find</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {item.highlights.map((highlight) => (
              <div key={highlight} className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_28px_rgba(11,47,116,0.06)]">
                <Tag className="h-5 w-5 text-[#f5b625]" />
                <h3 className="mt-3 text-[17px] font-black">{highlight}</h3>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-[#596a82]">
                  Explore {highlight.toLowerCase()} options from local {categoryName.toLowerCase()} businesses.
                </p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-[26px] font-black leading-tight sm:text-[34px]">Related businesses</h2>
          {relatedBusinesses.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedBusinesses.map((business) => (
                <Link key={business.slug} href={`/business/${business.slug}`} className="overflow-hidden rounded-[16px] border border-[#dfe6f2] bg-white p-4 shadow-[0_12px_28px_rgba(11,47,116,0.06)]">
                  <p className="text-[17px] font-black">{business.name}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#596a82]">{business.location.area}, {business.location.city}</p>
                  <p className="mt-3 line-clamp-2 text-[13px] font-semibold leading-6 text-[#596a82]">{business.description || business.subtitle}</p>
                  <div className="mt-4 inline-flex rounded-full bg-[#f5b625] px-4 py-2 text-[12px] font-black text-[#08285f]">Open business</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[16px] border border-dashed border-[#cbd7ea] bg-white p-6 text-center">
              <p className="font-black">No related businesses yet</p>
              <p className="mt-2 text-[13px] font-semibold text-[#596a82]">Listings will appear here when this category grows.</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-[18px] border border-[#dfe6f2] bg-white p-5 shadow-[0_14px_32px_rgba(11,47,116,0.07)]">
            <h2 className="text-[20px] font-black">More in {categoryName}</h2>
            <div className="mt-4 space-y-3">
              {siblingItems.map((entry) => (
                <Link key={entry.slug} href={`/category/${slug}/${entry.slug}`} className="grid grid-cols-[72px_1fr] gap-3 rounded-[14px] bg-[#f6f8fc] p-3">
                  <div className="h-[72px] rounded-[12px] bg-cover bg-center" style={{ backgroundImage: `url(${entry.image})` }} />
                  <div className="min-w-0">
                    <p className="truncate font-black">{entry.name}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#596a82]">{entry.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}
