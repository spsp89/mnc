import type { Metadata } from "next";

import { EcosystemPage } from "@/components/nearu/ecosystem-page";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages.feed;

export const metadata: Metadata = {
  title: pageTitle("Feed"),
  description: page.metaDescription,
  alternates: { canonical: "/feed" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Feed"),
    description: page.metaDescription,
    url: absoluteUrl("/feed"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function FeedPage() {
  return <EcosystemPage data={page} />;
}
