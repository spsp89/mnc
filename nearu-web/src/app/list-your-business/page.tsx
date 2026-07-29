import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { BadgeCheck, ImagePlus, QrCode, Search, Store, WalletCards } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("List Your Business"),
  description: "List your local business on BNC Nearu with a verified profile, digital business card, UPI details, offers, and discovery tools.",
  alternates: { canonical: "/list-your-business" },
  openGraph: defaultOpenGraph({
    title: pageTitle("List Your Business"),
    description: "Create a trusted local business profile and digital business card on BNC Nearu.",
    url: absoluteUrl("/list-your-business"),
  }),
};

export default function ListYourBusinessPage() {
  const steps: Array<{ title: string; text: string; icon: ComponentType<{ className?: string }> }> = [
    { title: "Create profile", text: "Add name, category, address, contact details, photos, and service tags.", icon: Store },
    { title: "Enable business card", text: "Share a clean digital card with call, WhatsApp, directions, and UPI.", icon: QrCode },
    { title: "Get discovered", text: "Appear in category pages, search results, featured rails, and ranked shops.", icon: Search },
    { title: "Build trust", text: "Use verification, opening hours, gallery images, and clear payment details.", icon: BadgeCheck },
  ];

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="mx-auto grid max-w-[1800px] gap-7 px-4 py-10 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">For business owners</p>
            <h1 className="mt-3 max-w-[840px] text-[40px] font-black leading-none sm:text-[62px]">List your business and start receiving local leads.</h1>
            <p className="mt-4 max-w-[720px] text-[16px] font-semibold leading-7 text-white/82">
              BNC Nearu gives every business a searchable profile, trusted card, UPI-ready payment section, and customer action buttons.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin" className="inline-flex rounded-full bg-[#f5b625] px-5 py-3 text-[13px] font-black text-[#08285f]">
                Open admin
              </Link>
              <Link href="/contact" className="inline-flex rounded-full border border-white/18 bg-white/10 px-5 py-3 text-[13px] font-black text-white">
                Contact support
              </Link>
            </div>
          </div>
          <div className="rounded-[18px] border border-white/14 bg-white/10 p-5 shadow-[0_22px_52px_rgba(0,0,0,0.22)]">
            <WalletCards className="h-10 w-10 text-[#f5b625]" />
            <h2 className="mt-5 text-[28px] font-black">What your card includes</h2>
            <div className="mt-4 grid gap-3 text-[13px] font-bold text-white/82">
              <span>Call, WhatsApp, route, share, and UPI actions.</span>
              <span>Verified badge, hours, services, gallery, and offers.</span>
              <span>One link for posters, invoices, chats, and social bios.</span>
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ title, text, icon: Icon }) => (
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
          <ImagePlus className="h-8 w-8 text-[#f5b625]" />
          <h2 className="mt-4 text-[28px] font-black">Recommended listing checklist</h2>
          <p className="mt-3 max-w-[900px] text-[14px] font-semibold leading-7 text-[#596a82]">
            Add a clear cover image, 3-6 gallery photos, phone, WhatsApp, UPI ID, opening hours, exact location, services, and verification status before publishing.
          </p>
        </section>
      </main>
    </div>
  );
}
