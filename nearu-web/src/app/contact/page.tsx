import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { SiteHeader } from "@/components/nearu/site-header";
import { absoluteUrl, defaultOpenGraph, pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Contact"),
  description: "Contact BNC Nearu for business listing help, customer support, partnerships, and marketplace questions.",
  alternates: { canonical: "/contact" },
  openGraph: defaultOpenGraph({
    title: pageTitle("Contact"),
    description: "Get support from BNC Nearu for listings, offers, business cards, and marketplace questions.",
    url: absoluteUrl("/contact"),
  }),
};

const contacts = [
  { label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210", icon: Phone },
  { label: "WhatsApp", value: "+91 98765 43210", href: "https://wa.me/919876543210", icon: MessageCircle },
  { label: "Email", value: "support@nearu.example", href: "mailto:support@nearu.example", icon: Mail },
  { label: "Location", value: "Kozhikode, Kerala", href: "https://www.google.com/maps/search/?api=1&query=Kozhikode%2C%20Kerala", icon: MapPin },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#0b2f74]">
      <section className="bg-[#061f55] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-5 md:px-10">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#f5b625]">Contact</p>
          <h1 className="mt-3 max-w-[760px] text-[40px] font-black leading-none sm:text-[62px]">Support for customers and businesses.</h1>
          <p className="mt-4 max-w-[690px] text-[16px] font-semibold leading-7 text-white/82">
            Reach us for listing updates, business card setup, payments, offers, or support questions.
          </p>
        </div>
      </section>
      <main className="mx-auto grid max-w-[1800px] gap-5 px-4 py-8 sm:px-5 md:px-10 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[18px] border border-[#dfe6f2] bg-white p-6 shadow-[0_12px_28px_rgba(11,47,116,0.06)]">
          <h2 className="text-[26px] font-black">Quick contacts</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {contacts.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} className="flex items-center gap-3 rounded-[14px] border border-[#e3e9f4] p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#edf3ff] text-[#0b2f74]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-[0.08em] text-[#71809b]">{item.label}</span>
                    <span className="block truncate text-[14px] font-black">{item.value}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </section>
        <section className="rounded-[18px] border border-[#dfe6f2] bg-white p-6 shadow-[0_12px_28px_rgba(11,47,116,0.06)]">
          <h2 className="text-[26px] font-black">What we can help with</h2>
          <ul className="mt-5 space-y-3 text-[14px] font-semibold leading-6 text-[#596a82]">
            <li>Business profile creation and edits.</li>
            <li>UPI, QR, and digital business card setup.</li>
            <li>Featured placement, offers, and plan questions.</li>
            <li>Incorrect listing details or marketplace support.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
