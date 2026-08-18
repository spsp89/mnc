import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MatchedEnquiryView } from "@/components/matched-enquiry-view";

export const metadata: Metadata = {
  title: "Get matched with a local business",
  description: "Describe a local service need and receive relevant responses with clear privacy controls.",
};

export default function EnquiryPage() {
  return <AppShell headerVariant="immersive"><MatchedEnquiryView /></AppShell>;
}
