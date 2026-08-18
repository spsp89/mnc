import { ArrowLeft, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="not-found-page"><span><MapPin size={38} /></span><small className="eyebrow">404 · Not found nearby</small><h1>This place isn’t on the map.</h1><p>The link may have changed, or the business is not publicly available.</p><div><Link href="/"><ArrowLeft size={15} /> Go home</Link><Link href="/search"><Search size={15} /> Search BNC</Link></div></section>
    </AppShell>
  );
}
