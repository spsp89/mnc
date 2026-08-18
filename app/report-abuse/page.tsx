import type { Metadata } from "next";
import { ContactView } from "@/components/contact-view";

export const metadata: Metadata = { title: "Report abuse or an inaccurate listing", robots: { index: false, follow: false } };

export default async function ReportAbusePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const business = Array.isArray(params.business) ? params.business[0] : params.business;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const reference = business ? `Report concerning ${business}${id ? ` (${id})` : ""}: ` : "Abuse or listing report: ";
  return <ContactView initialTopic="other" initialMessage={reference} heading="Report something that harms trust." eyebrow="Trust & safety" />;
}
