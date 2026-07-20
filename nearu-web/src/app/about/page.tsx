import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, MapPin, ShieldCheck, Store } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("About"),
  description: "Learn how BNC Nearu helps people discover trusted local shops, offers, services, and business cards.",
  alternates: { canonical: "/about" },
  openGraph: defaultOpenGraph({
    title: pageTitle("About"),
    description: "BNC Nearu is a local discovery and business growth platform for nearby shops and services.",
    url: absoluteUrl("/about"),
  }),
};

export default function AboutPage() {
  const pillars: Array<{ title: string; text: string; icon: ComponentType<{ className?: string }> }> = [
    { title: "Verified profiles", text: "Clear business details, trust signals, and owner-managed information.", icon: BadgeCheck },
    { title: "Local-first search", text: "Categories, ranking, distance, offers, and service tags for faster decisions.", icon: MapPin },
    { title: "Business growth", text: "Digital cards, featured placement, plans, and lead-focused contact actions.", icon: Store },
    { title: "Marketplace safety", text: "Structured admin controls and public pages for support, terms, and privacy.", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-5 md:px-10">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">About BNC Nearu</p>
          <h1 className="mt-3 max-w-[860px] text-[40px] font-black leading-none sm:text-[62px]">Local discovery built for trust.</h1>
          <p className="mt-4 max-w-[720px] text-[16px] font-semibold leading-7 text-white/82">
            Nearu brings nearby shops, services, offers, and business cards into one searchable marketplace for Kozhikode.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_26px_rgba(11,47,116,0.06)]">
              <div className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#fff4d6] text-[#bd7600]">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-[19px] font-black">{title}</h2>
              <p className="mt-2 text-[13px] font-semibold leading-6 text-[#596a82]">{text}</p>
            </article>
          ))}
        </div>
        <section className="mt-8 rounded-[18px] border border-[#dfe6f2] bg-white p-6 shadow-[0_12px_28px_rgba(11,47,116,0.06)]">
          <Building2 className="h-8 w-8 text-[#f5b625]" />
          <h2 className="mt-4 text-[28px] font-black">For customers and business owners</h2>
          <p className="mt-3 max-w-[900px] text-[14px] font-semibold leading-7 text-[#596a82]">
            Customers can compare trusted listings quickly. Business owners can create a public profile, share a digital business card, publish offers, and receive calls, WhatsApp messages, directions clicks, and UPI payments.
          </p>
          <Link href="/list-your-business" className="mt-5 inline-flex rounded-full bg-[#0b2f74] px-5 py-3 text-[13px] font-black text-white">
            List your business
          </Link>
        </section>
      </main>
    </div>
  );
}
