import type { Metadata } from "next";
import { Gift, ReceiptText, ShieldCheck, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getPublicWeeklyDraws } from "@/lib/public-api";
import { RewardCodeClaim } from "@/components/reward-code-claim";

export const metadata: Metadata = {
  title: "Rewards and festival draws",
  description: "See current BNC weekly gifts, monthly rewards, festival bumpers and published winners.",
};
export const dynamic = "force-dynamic";

export default async function WeeklyDrawPage() {
  const draws = await getPublicWeeklyDraws();
  const openDraw = draws.find((draw) => draw.status === "OPEN");
  const winners = draws.filter((draw) => draw.status === "PUBLISHED" && draw.winner);
  return (
    <AppShell>
      <main className="weekly-draw-page">
        <section className="weekly-draw-hero">
          <span><Gift size={18} /> Weekly gifts · monthly draws · festival bumpers</span>
          <h1>{openDraw?.title ?? "Weekly purchase rewards"}</h1>
          <p>{openDraw?.prizeDescription ?? "New draws will appear here when an eligibility period opens."}</p>
          {openDraw && <strong>Entries close {new Date(openDraw.weekEndsAt).toLocaleString("en-IN")}</strong>}
        </section>
        <RewardCodeClaim />
        <section className="weekly-draw-rules">
          <article><ReceiptText size={24} /><div><strong>₹200 purchase entry</strong><p>Eligible BNC orders enter automatically. For direct shop payments, the merchant issues a unique ID that the customer claims inside BNC.</p></div></article>
          <article><ShieldCheck size={24} /><div><strong>Reproducible selection</strong><p>After entries close, BNC stores a candidate snapshot and publishes the seed and cryptographic hashes used to calculate the winning index.</p></div></article>
          <article><Trophy size={24} /><div><strong>Privacy-safe result</strong><p>The public result contains the winner&apos;s display name, city and verified order number without exposing other customer entries.</p></div></article>
        </section>
        <section className="weekly-winner-section">
          <div><span className="eyebrow">Verified results</span><h2>Recent winners</h2></div>
          {winners.length ? <div className="weekly-winner-grid">{winners.map((draw) => <article key={draw.id}><Trophy size={22} /><small>{draw.title}</small><h3>{draw.winner!.name}</h3><p>{draw.winner!.city}</p><strong>{draw.prizeDescription}</strong><span>Order {draw.winner!.orderNumber ?? "verified"}</span>{draw.audit && <details className="weekly-audit"><summary>Verify selection audit</summary><dl><div><dt>Algorithm</dt><dd>{draw.audit.algorithm}</dd></div><div><dt>Entries</dt><dd>{draw.audit.candidateCount}</dd></div><div><dt>App activity</dt><dd>{draw.audit.usageEventCount} events</dd></div><div><dt>Winning index</dt><dd>{draw.audit.selectionIndex}</dd></div><div><dt>Candidate hash</dt><dd><code>{draw.audit.candidateHash}</code></dd></div><div><dt>Published seed</dt><dd><code>{draw.audit.selectionSeed}</code></dd></div><div><dt>Selection hash</dt><dd><code>{draw.audit.selectionHash}</code></dd></div></dl></details>}</article>)}</div> : <div className="empty-state"><Trophy size={28} /><h2>No published winner yet</h2><p>Audited weekly results will appear here.</p></div>}
        </section>
      </main>
    </AppShell>
  );
}
