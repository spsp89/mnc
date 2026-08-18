import type { Metadata } from "next";
import { RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "You are offline", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return (
    <AppShell>
      <section className="not-found-page">
        <span><WifiOff size={38} /></span>
        <small className="eyebrow">Offline mode</small>
        <h1>Your neighbourhood will be back shortly.</h1>
        <p>Previously opened BNC pages may still be available. Reconnect to search live availability or send an enquiry.</p>
        <div><Link href="/"><RefreshCw size={15} /> Try again</Link></div>
      </section>
    </AppShell>
  );
}
