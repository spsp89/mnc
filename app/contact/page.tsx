import type { Metadata } from "next";
import { ContactView } from "@/components/contact-view";

export const metadata: Metadata = { title: "Contact BNC" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic = "support" } = await searchParams;
  return <ContactView initialTopic={topic === "select-plan" ? "plans" : topic} />;
}
