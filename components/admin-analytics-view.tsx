import { Activity, BadgeIndianRupee, Building2, MousePointerClick, Search, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type AnalyticsPayload = {
  range?: { from?: string; to?: string };
  events?: Record<string, number>;
  activeBusinesses?: number;
  activeUsers?: number;
  leads?: number;
  capturedPayments?: number;
  capturedAmount?: string | number;
};

function eventLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function AdminAnalyticsView({ payload }: { payload: unknown }) {
  const data = (payload && typeof payload === "object" ? payload : {}) as AnalyticsPayload;
  const events = Object.entries(data.events ?? {}).sort((left, right) => right[1] - left[1]);
  const peak = Math.max(...events.map(([, count]) => count), 1);
  const from = data.range?.from ? new Date(data.range.from).toLocaleDateString("en-IN") : "—";
  const to = data.range?.to ? new Date(data.range.to).toLocaleDateString("en-IN") : "—";

  return (
    <section className="admin-analytics-workspace">
      <div className="admin-stat-grid">
        <article><span><Building2 size={21} /></span><div><small>Active businesses</small><strong>{data.activeBusinesses ?? 0}</strong></div></article>
        <article><span><Users size={21} /></span><div><small>Active users</small><strong>{data.activeUsers ?? 0}</strong></div></article>
        <article><span><Search size={21} /></span><div><small>Matched leads</small><strong>{data.leads ?? 0}</strong></div></article>
        <article><span><BadgeIndianRupee size={21} /></span><div><small>Captured value</small><strong>{formatCurrency(Number(data.capturedAmount ?? 0))}</strong></div></article>
      </div>
      <section className="admin-analytics-card">
        <header><div><span className="eyebrow">Marketplace activity</span><h2>Tracked customer actions</h2><p>{from} to {to} · {data.capturedPayments ?? 0} captured payments</p></div><Activity size={24} /></header>
        <div className="admin-event-list">
          {events.map(([name, count]) => (
            <article key={name}>
              <span><MousePointerClick size={17} /></span>
              <div><strong>{eventLabel(name)}</strong><i><b style={{ width: `${Math.max(5, (count / peak) * 100)}%` }} /></i></div>
              <b>{count}</b>
            </article>
          ))}
          {!events.length && <div className="admin-empty"><Activity size={30} /><strong>No tracked activity in this range</strong><span>Analytics events will appear after customer interactions.</span></div>}
        </div>
      </section>
    </section>
  );
}
