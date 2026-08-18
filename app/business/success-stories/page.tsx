import type { Metadata } from "next";
import { ArrowRight, BarChart3, CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Business growth workflow" };

export default function BusinessStoryPage() {
  return (
    <AppShell>
      <section className="story-page">
        <div className="story-heading"><span className="eyebrow">Business workflow</span><h1>Build a clearer local growth loop.</h1><p>This page explains the product workflow without customer stories, sample performance, or invented outcomes.</p></div>
        <div className="story-steps">
          <article><span>01</span><div><CheckCircle2 size={22} /><h2>Publish a complete profile</h2><p>Add service areas, starting prices, working hours, photos, availability and trust evidence through the business backend.</p></div></article>
          <article><span>02</span><div><BarChart3 size={22} /><h2>Measure real discovery</h2><p>Search impressions, profile views, contact taps and enquiry conversion should come from measured production events.</p></div></article>
          <article><span>03</span><div><MessageCircle size={22} /><h2>Respond with context</h2><p>Authorised requests can include requirement, service area, timing and the customer’s permitted contact channel.</p></div></article>
        </div>
        <section className="info-cta"><div><h2>Ready to create your profile?</h2><p>Start with verified business information.</p></div><Link href="/business/add">List your business <ArrowRight size={15} /></Link></section>
      </section>
    </AppShell>
  );
}
