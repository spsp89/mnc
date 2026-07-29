import type { Metadata } from "next";

import { PublicHome } from "@/components/nearu/public-home";
import { getCatalogData, getDealsData, getOffersData } from "@/lib/catalog";
import { absoluteUrl, defaultOpenGraph, pageTitle, siteDescription } from "@/lib/seo";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    featured?: string;
    popular?: string;
    sort?: string;
  }>;
};

export const metadata: Metadata = {
  title: pageTitle("Discover Local Shops and Services"),
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: defaultOpenGraph({
    title: pageTitle("Discover Local Shops and Services"),
    description: siteDescription,
    url: absoluteUrl("/"),
  }),
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const data = await getCatalogData({
    query: params.q,
    category: params.category,
    featured: params.featured === "true" ? true : undefined,
    popular: params.popular === "true" ? true : undefined,
    sort:
      params.sort === "rating" || params.sort === "distance" || params.sort === "name"
        ? params.sort
        : "default",
  });
  const deals = getDealsData();
  const offers = getOffersData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Nearu",
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl("/")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <PublicHome data={data} deals={deals} offers={offers} />
    </>
  );
}
