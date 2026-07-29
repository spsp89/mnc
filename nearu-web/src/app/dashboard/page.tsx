import type { Metadata } from "next";

import { EcosystemPage } from "@/components/nearu/ecosystem-page";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages.dashboard;

export const metadata: Metadata = {
  title: pageTitle("Dashboard"),
  description: page.metaDescription,
  alternates: { canonical: "/dashboard" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Dashboard"),
    description: page.metaDescription,
    url: absoluteUrl("/dashboard"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function DashboardPage() {
  return <EcosystemPage data={page} />;
}
