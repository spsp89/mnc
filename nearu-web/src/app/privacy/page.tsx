import type { Metadata } from "next";

import { SiteHeader } from "@/components/nearu/site-header";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Privacy"),
  description: "Privacy policy for BNC Nearu customers and listed businesses.",
  alternates: { canonical: "/privacy" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Privacy"),
    description: "How BNC Nearu handles marketplace and business listing information.",
    url: absoluteUrl("/privacy"),
  }),
};

export default function PrivacyPage() {
  const sections = [
    ["Information we use", "We use listing details such as business name, contact number, area, category, images, UPI ID, opening hours, offers, and marketplace signals to display public business profiles."],
    ["Customer interactions", "When users call, message, request directions, or use UPI details, those interactions may happen through phone, maps, WhatsApp, or payment apps outside BNC Nearu."],
    ["Admin data", "Admin users can create and update categories, listings, images, payment details, and trust signals. Access should be limited to authorized operators."],
    ["Analytics and improvement", "Marketplace usage can be measured to improve search, ranking, listing quality, business leads, and support workflows."],
    ["Corrections", "Businesses and customers can contact support to request corrections to inaccurate listing information."],
  ];

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-5 md:px-10">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">Privacy</p>
          <h1 className="mt-3 text-[40px] font-black leading-none sm:text-[62px]">Privacy policy</h1>
          <p className="mt-4 max-w-[760px] text-[16px] font-semibold leading-7 text-white/82">
            How BNC Nearu handles marketplace information, business profiles, and user interactions.
          </p>
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
