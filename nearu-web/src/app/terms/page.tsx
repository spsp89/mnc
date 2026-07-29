import type { Metadata } from "next";

import { SiteHeader } from "@/components/nearu/site-header";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Terms"),
  description: "Terms of use for customers and businesses using BNC Nearu.",
  alternates: { canonical: "/terms" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Terms"),
    description: "Terms of use for BNC Nearu marketplace.",
    url: absoluteUrl("/terms"),
  }),
};

export default function TermsPage() {
  const sections = [
    ["Marketplace role", "BNC Nearu helps users discover local businesses. Business owners are responsible for the accuracy of listing details, prices, offers, timings, and payment information."],
    ["Customer actions", "Calls, WhatsApp messages, directions, bookings, and UPI payments happen between the customer and the listed business. Users should verify details before purchase or payment."],
    ["Business listings", "We may review, edit, hide, or remove listings that are misleading, incomplete, unsafe, or reported by users."],
    ["Offers and promotions", "Offers must include clear validity, item details, and conditions. Businesses are responsible for honoring published offers."],
    ["Acceptable use", "Do not misuse search, forms, reviews, admin tools, or contact actions. Fraudulent or abusive activity can lead to removal."],
  ];

  return (
    <LegalPage title="Terms of use" description="Clear rules for customers, businesses, offers, and marketplace trust." sections={sections} />
  );
}

function LegalPage({ title, description, sections }: { title: string; description: string; sections: string[][] }) {
  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-5 md:px-10">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">BNC Nearu</p>
          <h1 className="mt-3 text-[40px] font-black leading-none sm:text-[62px]">{title}</h1>
          <p className="mt-4 max-w-[760px] text-[16px] font-semibold leading-7 text-white/82">{description}</p>
        </div>
      </section>
      <main className="mx-auto max-w-[980px] px-4 py-8 sm:px-5 md:px-10">
        <div className="space-y-4">
          {sections.map(([heading, text]) => (
            <section key={heading} className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_26px_rgba(11,47,116,0.05)]">
              <h2 className="text-[20px] font-black">{heading}</h2>
              <p className="mt-2 text-[14px] font-semibold leading-7 text-[#596a82]">{text}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
