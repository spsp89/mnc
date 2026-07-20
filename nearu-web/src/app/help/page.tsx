import type { Metadata } from "next";

import { EcosystemPage } from "@/components/nearu/ecosystem-page";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages.help;

export const metadata: Metadata = {
  title: pageTitle("Help"),
  description: page.metaDescription,
  alternates: { canonical: "/help" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Help"),
    description: page.metaDescription,
    url: absoluteUrl("/help"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function HelpPage() {
  return <EcosystemPage data={page} />;
}
