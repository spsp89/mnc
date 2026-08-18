import type { Metadata } from "next";
import { BadgeCheck, MapPinned, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "About BNC", description: "Why BNC is building a clearer, more trustworthy local discovery network." };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About BNC" title="Local discovery should feel dependable." intro="BNC helps people understand nearby businesses clearly, while giving responsible local owners practical tools to be found and respond.">
      <section className="info-lead-grid"><div><h2>A useful bridge between intent and local expertise</h2><p>Search engines can show what exists. BNC is designed to help people decide: accurate service areas, clear profile detail, trustworthy review signals, transparent sponsorship and direct contact choices.</p><p>We are beginning with Kerala, where dense local commerce, strong neighbourhood identities and multilingual customers make context especially important.</p></div><aside><strong>BNC means</strong><span>Business Network &amp; Commerce</span><small>A discovery and marketplace layer for neighbourhood economies.</small></aside></section>
      <section className="value-grid">
        <article><MapPinned size={22} /><h3>Local by design</h3><p>Distance, locality, service area and current availability shape results.</p></article>
        <article><BadgeCheck size={22} /><h3>Evidence over decoration</h3><p>Verification, completeness and review integrity remain visible and explainable.</p></article>
        <article><ShieldCheck size={22} /><h3>Consent before contact</h3><p>Customer details stay private and are shared for a stated enquiry purpose.</p></article>
        <article><Store size={22} /><h3>Fair business access</h3><p>Bronze profiles remain useful; higher-plan visibility is labelled and never presented as organic rank.</p></article>
      </section>
      <section className="info-cta"><div><h2>Building a useful local profile?</h2><p>Start free, add evidence and improve what customers can understand.</p></div><Link href="/business/add">List your business</Link></section>
    </InfoPage>
  );
}
