import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CakeSlice,
  Clock3,
  Copy,
  Download,
  HousePlus,
  Globe2,
  Mail,
  MapPin,
  MonitorSmartphone,
  Scissors,
  MessageCircle,
  Phone,
  QrCode,
  ShoppingCart,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { categoryItemGroups } from "@/lib/category-items";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

const cardUrl = "bnc.nearu.in/card/chams";
const upiId = "chamsglobal@upi";

export const metadata: Metadata = {
  title: pageTitle("Business Card"),
  description:
    "Create a polished digital business card for calls, WhatsApp, directions, services, and verified local visibility on BNC Nearu.",
  alternates: { canonical: "/business-card" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Business Card"),
    description:
      "A premium digital business card page for trusted local businesses on BNC Nearu.",
    url: absoluteUrl("/business-card"),
    images: [
      {
        url: absoluteUrl("/mockup/im-card_banner.jpg"),
        width: 1200,
        height: 630,
        alt: "BNC Nearu digital business card",
      },
    ],
  }),
};

const contactActions = [
  { label: "Call", icon: Phone, href: "tel:+919876543210" },
  { label: "WhatsApp", icon: MessageCircle, href: "https://wa.me/919876543210" },
  { label: "Directions", icon: MapPin, href: "/" },
  { label: "Share", icon: Share2, href: "/" },
];

const trustItems = [
  { value: "Verified", label: "business profile", icon: BadgeCheck },
  { value: "4.8", label: "customer rating", icon: Star },
  { value: "10+", label: "years serving locally", icon: ShieldCheck },
];

const details = [
  { label: "Phone", value: "+91 98765 43210", icon: Phone },
  { label: "Email", value: "hello@chamsglobal.com", icon: Mail },
  { label: "Website", value: "chamsglobal.com", icon: Globe2 },
  { label: "Hours", value: "Mon - Sat, 9:30 AM - 8:00 PM", icon: Clock3 },
];

const services = ["Retail", "B2B supply", "Digital catalogue", "Local delivery"];

const categoryIcons = {
  grocery: ShoppingCart,
  restaurants: UtensilsCrossed,
  bakery: CakeSlice,
  tailors: Scissors,
  beauty: Sparkles,
  electronics: MonitorSmartphone,
  "home-services": HousePlus,
  more: Building2,
};

const categories = categoryItemGroups.map((category) => ({
  ...category,
  icon: categoryIcons[category.categorySlug as keyof typeof categoryIcons] ?? Building2,
}));

export default function BusinessCardPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf5] text-[#10233f]">
      <section className="bg-[#071f4f] text-white">
        <SiteHeader />
        <div className="bg-[linear-gradient(135deg,#071f4f_0%,#0d3f7a_48%,#184d69_100%)]">
          <div className="mx-auto grid max-w-[1800px] gap-8 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-12">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f4b227]">
                BNC digital identity
              </p>
              <h1 className="mt-3 max-w-[760px] text-[40px] font-black leading-[1] sm:text-[58px] lg:text-[74px]">
                A business card that feels established.
              </h1>
              <p className="mt-4 max-w-[690px] text-[15px] font-semibold leading-7 text-white/84 sm:text-[17px]">
                Give every shop a polished profile with one shareable card for calls, WhatsApp,
                directions, services, ratings, and verified local presence.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f4b227] px-5 py-3 text-[13px] font-black text-[#071f4f] transition hover:bg-[#ffd369]"
                >
                  Create your card
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/9 px-5 py-3 text-[13px] font-black text-white transition hover:bg-white/15"
                >
                  View marketplace
                </Link>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr] lg:items-stretch">
              <article className="overflow-hidden rounded-[18px] border border-white/18 bg-[#fffdf7] text-[#10233f] shadow-[0_28px_70px_rgba(0,0,0,0.28)]">
                <div className="min-h-[180px] bg-[linear-gradient(0deg,rgba(7,31,79,0.14),rgba(7,31,79,0.02)),url('/mockup/im-card_banner.jpg')] bg-cover bg-center" />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#e9f6ef] px-3 py-1 text-[12px] font-black text-[#14714a]">
                        <BadgeCheck className="h-4 w-4" />
                        Verified profile
                      </div>
                      <h2 className="mt-4 text-[28px] font-black leading-tight sm:text-[34px]">
                        Chams Global
                      </h2>
                      <p className="mt-2 max-w-[460px] text-[13px] font-semibold leading-6 text-[#5e6d82]">
                        Trusted local business for retail products, B2B supply, and everyday
                        customer service in Kozhikode.
                      </p>
                    </div>
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[12px] border border-[#dce4ef] bg-white text-[#071f4f]">
                      <QrCode className="h-12 w-12" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {contactActions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="grid min-h-[78px] place-items-center rounded-[12px] border border-[#dfe6f2] bg-[#f8fafc] px-2 py-3 text-center text-[12px] font-black text-[#143b75] transition hover:border-[#f4b227] hover:bg-[#fff6dd]"
                        >
                          <Icon className="mb-2 h-5 w-5" />
                          {action.label}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {details.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.label} className="flex min-h-[64px] items-center gap-3 rounded-[12px] border border-[#e5e9f0] bg-white px-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#fff2cb] text-[#bd7600]">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-black uppercase tracking-[0.08em] text-[#75839a]">
                              {item.label}
                            </span>
                            <span className="block truncate text-[13px] font-black text-[#10233f]">
                              {item.value}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>

              <aside className="rounded-[18px] border border-white/18 bg-white/10 p-4 text-white shadow-[0_22px_54px_rgba(0,0,0,0.18)]">
                <div className="rounded-[14px] bg-white p-4 text-[#10233f]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#143b75] text-white">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#6d7a90]">
                        Card link
                      </p>
                      <p className="text-[15px] font-black">{cardUrl}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#143b75] px-4 text-[12px] font-black text-white">
                      <Copy className="h-4 w-4" />
                      Copy link
                    </button>
                    <button className="grid h-11 w-11 place-items-center rounded-full border border-[#dfe6f2] text-[#143b75]" aria-label="Download business card">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {trustItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-[12px] border border-white/14 bg-white/8 p-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#f4b227] text-[#071f4f]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-[18px] font-black">{item.value}</span>
                          <span className="block text-[12px] font-bold text-white/72">{item.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-[14px] border border-white/14 bg-[#071f4f] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#f4b227]">
                        UPI enabled
                      </p>
                      <p className="mt-1 text-[19px] font-black">Accept payments instantly</p>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-white text-[#071f4f]">
                      <WalletCards className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 rounded-[12px] bg-white p-3 text-[#10233f]">
                    <div className="flex items-center gap-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] border border-[#dfe6f2] bg-[#f8fafc] text-[#143b75]">
                        <QrCode className="h-10 w-10" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#75839a]">
                          UPI ID
                        </p>
                        <p className="truncate text-[14px] font-black">{upiId}</p>
                        <p className="mt-1 text-[12px] font-bold text-[#607086]">
                          PhonePe, Google Pay, Paytm, BHIM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 py-8 sm:px-5 md:px-10">
        <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#b77700]">
              What makes it professional
            </p>
            <h2 className="mt-2 max-w-[560px] text-[30px] font-black leading-tight sm:text-[40px]">
              Built for owners who need trust before conversation.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "A polished public profile instead of scattered contact details.",
              "Fast actions for calling, messaging, directions, and sharing.",
              "Business hours, services, address, rating, and verification signals.",
              "A reusable link for WhatsApp, posters, invoices, and social bios.",
            ].map((item) => (
              <div key={item} className="rounded-[14px] border border-[#dfe6f2] bg-white p-4 text-[14px] font-bold leading-6 text-[#51627a] shadow-[0_10px_24px_rgba(16,35,63,0.05)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#b77700]">
                Cards for every category
              </p>
              <h2 className="mt-2 max-w-[760px] text-[30px] font-black leading-tight sm:text-[40px]">
                One business card format, adapted for every local business type.
              </h2>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-[#102f60] px-5 py-3 text-[13px] font-black text-white"
            >
              Add category card
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const sampleItems = category.items.slice(0, 3).map((item) => item.name);

              return (
                <article
                  key={category.categorySlug}
                  className="rounded-[16px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_28px_rgba(16,35,63,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#fff2cb] text-[#bd7600]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[#eaf3ff] px-3 py-1 text-[11px] font-black text-[#143b75]">
                      UPI ready
                    </span>
                  </div>
                  <h3 className="mt-4 text-[19px] font-black">{category.categoryName}</h3>
                  <p className="mt-2 min-h-[72px] text-[13px] font-semibold leading-6 text-[#5e6d82]">
                    {category.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sampleItems.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#dfe6f2] bg-[#f8fafc] px-3 py-1.5 text-[12px] font-bold text-[#52637a]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
          <div className="rounded-[18px] border border-[#dfe6f2] bg-white p-5 shadow-[0_12px_30px_rgba(16,35,63,0.06)] sm:p-6">
            <h2 className="text-[24px] font-black leading-tight sm:text-[30px]">Services shown on the card</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {services.map((service) => (
                <span key={service} className="rounded-full border border-[#dce4ef] bg-[#f8fafc] px-4 py-2 text-[13px] font-black text-[#143b75]">
                  {service}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-[820px] text-[14px] font-semibold leading-7 text-[#5e6d82]">
              The card can work as a lightweight landing page for each business, while still
              connecting back to the BNC marketplace, category pages, and admin updates.
            </p>
          </div>

          <div className="rounded-[18px] border border-[#123b75] bg-[#102f60] p-5 text-white shadow-[0_16px_36px_rgba(16,47,96,0.18)] sm:p-6">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#f4b227]">
              Ready format
            </p>
            <h2 className="mt-2 text-[24px] font-black leading-tight">Use it for any local business.</h2>
            <p className="mt-3 text-[13px] font-semibold leading-6 text-white/76">
              Replace the sample name, phone, address, services, image, and link from admin to
              produce a mature card for shops, clinics, suppliers, restaurants, and service teams.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
