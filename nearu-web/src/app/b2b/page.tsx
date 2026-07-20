import type { Metadata } from "next";

import { EcosystemPage } from "@/components/nearu/ecosystem-page";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages.b2b;

export const metadata: Metadata = {
  title: pageTitle("B2B"),
  description: page.metaDescription,
  alternates: { canonical: "/b2b" },
  openGraph: defaultOpenGraph({
    title: pageTitle("B2B"),
    description: page.metaDescription,
    url: absoluteUrl("/b2b"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function B2BPage() {
  return <EcosystemPage data={page} />;
}
