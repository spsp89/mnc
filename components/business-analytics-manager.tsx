"use client";

import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  Eye,
  LoaderCircle,
  MessageSquareText,
  MousePointerClick,
  PackageCheck,
  Star,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type AnalyticsData = {
  range: { from: string | null; to: string | null };
  events: Record<string, number>;
  enquiries: number;
  matchedLeads: number;
  saves: number;
  reviews: { count: number; averageRating: number | null };
  rates: { profileToContact: number; profileToEnquiry: number };
  publishedProducts?: number;
  source?: string;
};

const eventLabels: Record<string, string> = {
  SEARCH_IMPRESSION: "Search impressions",
  PROFILE_VIEW: "Profile views",
  CALL_CLICK: "Call clicks",
  WHATSAPP_CLICK: "WhatsApp clicks",
  WEBSITE_CLICK: "Website visits",
  DIRECTIONS_CLICK: "Direction requests",
  ENQUIRY_START: "Enquiry starts",
  PRODUCT_VIEW: "Product views",
  SERVICE_VIEW: "Service views",
};

function period(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function BusinessAnalyticsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!businessId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const range = period(days);
      const query = new URLSearchParams({ businessId, ...range });
      const response = await fetch(appPath(`/api/business/analytics?${query.toString()}`));
      const body = await response.json() as { data?: AnalyticsData; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Analytics could not be loaded.");
      setData(body.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId, days]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const profileViews = data?.events.PROFILE_VIEW ?? 0;
  const contacts = (data?.events.CALL_CLICK ?? 0) + (data?.events.WHATSAPP_CLICK ?? 0) + (data?.events.WEBSITE_CLICK ?? 0);
  const eventRows = useMemo(() => Object.entries(data?.events ?? {}).sort((left, right) => right[1] - left[1]), [data]);
  const maximum = Math.max(1, ...eventRows.map(([, count]) => count));

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Measured customer activity</span><h1>Analytics</h1><p>Use real discovery, contact, enquiry, lead, save and review activity to understand how customers find this workspace.</p></div>
        <div className="business-product-heading-actions">{user.businesses.length > 1 && <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>}<label><span>Period</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option></select></label></div>
      </section>
      {message && <p className="settings-saved" role="alert"><CheckCircle2 size={15} /> {message}</p>}
      {data?.source === "catalog-fallback" && <p className="business-data-notice"><BarChart3 size={16} /> Catalogue and enquiry totals are live; event-level analytics will populate after the analytics API rollout.</p>}
      <section className="manager-summary-grid">
        <article><Eye size={20} /><div><strong>{profileViews.toLocaleString("en-IN")}</strong><small>Profile views</small></div></article>
        <article><MousePointerClick size={20} /><div><strong>{contacts.toLocaleString("en-IN")}</strong><small>Contact actions</small></div></article>
        <article><MessageSquareText size={20} /><div><strong>{data?.enquiries ?? 0}</strong><small>Enquiries</small></div></article>
        <article><Target size={20} /><div><strong>{data?.matchedLeads ?? 0}</strong><small>Matched leads</small></div></article>
      </section>
      <div className="business-analytics-layout">
        <section className="manager-table-card business-event-chart"><header><div><span className="eyebrow">Activity breakdown</span><h2>Measured events</h2></div></header>{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading analytics</strong></div> : eventRows.length ? <div>{eventRows.map(([name, count]) => <article key={name}><div><span>{eventLabels[name] ?? name.replaceAll("_", " ")}</span><strong>{count.toLocaleString("en-IN")}</strong></div><i><b style={{ width: `${Math.max(4, count / maximum * 100)}%` }} /></i></article>)}</div> : <div className="admin-empty business-short-empty"><BarChart3 size={27} /><strong>No measured events in this period</strong><span>Counts begin when customers view or contact this business.</span></div>}</section>
        <aside className="manager-table-card business-conversion-card"><header><span className="eyebrow">Conversion</span><h2>Outcome signals</h2></header><dl><div><dt><Bookmark size={16} /> Saves</dt><dd>{data?.saves ?? 0}</dd></div><div><dt><Star size={16} /> Published reviews</dt><dd>{data?.reviews.count ?? 0}</dd></div><div><dt><PackageCheck size={16} /> Published products</dt><dd>{data?.publishedProducts ?? "—"}</dd></div><div><dt>View → contact</dt><dd>{((data?.rates.profileToContact ?? 0) * 100).toFixed(1)}%</dd></div><div><dt>View → enquiry</dt><dd>{((data?.rates.profileToEnquiry ?? 0) * 100).toFixed(1)}%</dd></div></dl>{data?.reviews.averageRating != null && <p><Star size={15} fill="currentColor" /> {Number(data.reviews.averageRating).toFixed(1)} average rating</p>}</aside>
      </div>
    </DashboardShell>
  );
}
