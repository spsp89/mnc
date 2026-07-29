import type { Metadata } from "next";

import { EcosystemPage } from "@/components/nearu/ecosystem-page";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const page = ecosystemPages.jobs;

export const metadata: Metadata = {
  title: pageTitle("Jobs"),
  description: page.metaDescription,
  alternates: { canonical: "/jobs" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Jobs"),
    description: page.metaDescription,
    url: absoluteUrl("/jobs"),
    images: [{ url: absoluteUrl(page.heroImage), width: 1200, height: 630, alt: page.title }],
  }),
};

export default function JobsPage() {
  return <EcosystemPage data={page} />;
}
