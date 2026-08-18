"use client";

import {
  Building2,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  FileText,
  IndianRupee,
  LoaderCircle,
  MessageSquareText,
  Store,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Report = {
  range: { from: string; to: string };
  totalMerchants: number;
  approvedMerchants: number;
  pendingMerchants: number;
  activeListings: number;
  totalOffers: number;
  activeOffers: number;
  merchantsInRange: number;
  listingsInRange: number;
  offersInRange: number;
  enquiries: number;
  paymentsInRange: number;
  capturedPaymentsInRange: number;
  capturedPaymentValueInRange: number | string;
  subscriptionsInRange: number;
  activeSubscriptions: number;
  subscriptionDistribution: Array<{ planId: string; name: string; count: number }>;
};

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function messageOf(body: { message?: string | string[] }, fallback: string) {
  return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback;
}
function currency(value: number | string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

export function AdminReportsDashboard({ user }: { user: BncSessionUser }) {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
  const [from, setFrom] = useState(isoDate(monthAgo));
  const [to, setTo] = useState(isoDate(now));
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setMessage("");
    if (!from || !to) {
      setData(null);
      setLoading(false);
      setMessage("Choose both a start and end date.");
      return;
    }
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59.999`);
    if (fromDate > toDate) {
      setData(null);
      setLoading(false);
      setMessage("Report start date must not be after end date.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: fromDate.toISOString(), to: toDate.toISOString() });
      const response = await fetch(appPath(`/api/admin/reports/summary?${params}`));
      const body = await response.json() as { data?: Report; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(messageOf(body, "Reports could not be loaded."));
      setData(body.data);
    } catch (error) {
      setData(null);
      setMessage(error instanceof Error ? error.message : "Reports could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const snapshotCards = data ? [
    { label: "Total merchants", value: data.totalMerchants, icon: Building2 },
    { label: "Approved merchants", value: data.approvedMerchants, icon: CheckCircle2 },
    { label: "Pending merchants", value: data.pendingMerchants, icon: Building2 },
    { label: "Active listings", value: data.activeListings, icon: Store },
    { label: "Total offers", value: data.totalOffers, icon: Tag },
    { label: "Active offers", value: data.activeOffers, icon: Tag },
    { label: "Active subscriptions", value: data.activeSubscriptions, icon: CreditCard },
  ] : [];
  const activityCards = data ? [
    { label: "Merchants joined", value: data.merchantsInRange, icon: Building2 },
    { label: "Published listings created", value: data.listingsInRange, icon: Store },
    { label: "Offers created", value: data.offersInRange, icon: Tag },
    { label: "Enquiries received", value: data.enquiries, icon: MessageSquareText },
    { label: "Payment records", value: data.paymentsInRange, icon: CreditCard },
    { label: "Captured payments", value: data.capturedPaymentsInRange, icon: IndianRupee },
    { label: "Subscriptions started", value: data.subscriptionsInRange, icon: CalendarRange },
  ] : [];
  const noActivity = Boolean(data && activityCards.every((item) => item.value === 0));
  const max = Math.max(1, ...(data?.subscriptionDistribution.map((item) => item.count) ?? [1]));

  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Aggregate operations</span><h1>Reports and platform KPIs</h1><p>Current platform snapshots and database aggregates for the selected date range. No complete operational tables are loaded.</p></div></section>
      <section className="admin-filter-bar report-date-filter">
        <label>From<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} required /></label>
        <label>To<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} required /></label>
        <button type="button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </section>
      {message && <p className="form-error" role="alert"><FileText size={15} /> {message}</p>}
      {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading aggregate reports</strong></div></section> : data && <>
        <section className="manager-heading"><div><span className="eyebrow">Current snapshot</span><h2>Platform totals</h2></div></section>
        <section className="dashboard-metric-grid">{snapshotCards.map(({ label, value, icon: Icon }) => <article key={label}><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
        <section className="manager-heading"><div><span className="eyebrow">Selected date range</span><h2>Recorded activity</h2><p>{new Date(data.range.from).toLocaleDateString("en-IN")} – {new Date(data.range.to).toLocaleDateString("en-IN")}</p></div></section>
        <section className="dashboard-metric-grid">{activityCards.map(({ label, value, icon: Icon }) => <article key={label}><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}<article><span><IndianRupee size={18} /></span><div><small>Captured payment value</small><strong>{currency(data.capturedPaymentValueInRange)}</strong></div></article></section>
        {noActivity && <section className="manager-table-card"><div className="admin-empty"><CalendarRange size={28} /><strong>No activity in this date range</strong><span>Try a wider range to compare recorded platform activity.</span></div></section>}
        <section className="manager-table-card"><header><div><strong>Current subscription distribution</strong><span>Active and in-period subscriptions by configured plan</span></div></header>{data.subscriptionDistribution.length ? <div className="subscription-distribution">{data.subscriptionDistribution.map((item) => <article key={item.planId}><span>{item.name}</span><div><i style={{ width: `${Math.max(2, item.count / max * 100)}%` }} /></div><strong>{item.count}</strong></article>)}</div> : <div className="admin-empty"><CreditCard size={28} /><strong>No subscription plans found</strong></div>}</section>
      </>}
    </DashboardShell>
  );
}
