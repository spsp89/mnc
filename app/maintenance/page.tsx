import type { Metadata } from "next";
import { Clock3, RefreshCw, Wrench } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Scheduled maintenance", robots: { index: false, follow: false } };

export default function MaintenancePage() {
  return (
    <AppShell footer={false}>
      <section className="not-found-page">
        <span><Wrench size={38} /></span>
        <small className="eyebrow">Scheduled maintenance</small>
        <h1>BNC is getting a careful tune-up.</h1>
        <p>Public safety and data integrity come first. If this page is active during a release, retry shortly; submitted enquiries are not repeated automatically.</p>
        <div><Link href="/"><RefreshCw size={15} /> Check BNC</Link><Link href="/contact"><Clock3 size={15} /> Contact support</Link></div>
      </section>
    </AppShell>
  );
}
