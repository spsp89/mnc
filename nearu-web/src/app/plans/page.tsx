import type { Metadata } from "next";

import { EcosystemPage } from "@/components/nearu/ecosystem-page";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages.plans;

export const metadata: Metadata = {
  title: pageTitle("Plans"),
  description: page.metaDescription,
  alternates: { canonical: "/plans" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Plans"),
    description: page.metaDescription,
    url: absoluteUrl("/plans"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function PlansPage() {
  return <EcosystemPage data={page} />;
}
