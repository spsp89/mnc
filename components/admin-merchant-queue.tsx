"use client";

import { Building2, ChevronLeft, ChevronRight, LoaderCircle, MapPin, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath, readJsonResponse } from "@/lib/client-routing";

type MerchantRow = {
  id: string; name: string; status: string; verified: boolean; email: string | null;
  publicPhone: string | null; profileCompleteness: number; createdAt: string;
  owner: { legalName: string }; locations: Array<{ locality: string; city: string; district: string; state: string }>;
  subscriptions: Array<{ currentPeriodEnd: string; plan: { id: string; name: string } }>;
};
type Plan = { id: string; name: string };
type MerchantResponse = { data?: MerchantRow[]; meta?: { page: number; pageSize: number; total: number }; message?: string | string[] };

export function AdminMerchantQueue({ user }: { user: BncSessionUser }) {
  const [rows, setRows] = useState<MerchantRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0 });
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [location, setLocation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (submittedQuery) params.set("q", submittedQuery);
      if (status !== "ALL") params.set("status", status);
      if (planId) params.set("planId", planId);
      if (location.trim()) params.set("location", location.trim());
      if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString());
      if (to) params.set("to", new Date(`${to}T23:59:59.999`).toISOString());
      const response = await fetch(appPath(`/api/admin/merchants?${params}`));
      const body = await readJsonResponse<MerchantResponse>(response, "Merchant queue returned an unreadable response.");
      if (!response.ok || !body.data || !body.meta) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Merchant queue could not be loaded.");
      setRows(body.data); setMeta(body.meta);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Merchant queue could not be loaded."); }
    finally { setLoading(false); }
  }, [from, location, planId, status, submittedQuery, to]);

  useEffect(() => { void Promise.resolve().then(() => load(1)); }, [load]);
  useEffect(() => { void fetch(appPath("/api/subscription-plans")).then((response) => response.json() as Promise<{ data?: Plan[] }>).then((body) => setPlans(body.data ?? [])).catch(() => setPlans([])); }, []);
  function search(event: FormEvent) { event.preventDefault(); setSubmittedQuery(query.trim()); }
  const pages = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  return <DashboardShell mode="admin" user={user}>
    <section className="manager-heading admin-section-heading"><div><span className="eyebrow">Access-controlled queue</span><h1>Merchant administration</h1><p>Review merchant accounts and open the audited approval workflow.</p></div></section>
    <section className="admin-operations-card">
      <form className="admin-operation-tools" onSubmit={search}>
        <label><Search size={17} /><span className="sr-only">Search merchants</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Business, owner, phone, email, or location" /></label>
        <label className="admin-filter-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="PENDING">Pending approval</option><option value="ACTIVE">Approved</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option><option value="DRAFT">Draft only</option><option value="PENDING_VERIFICATION">Verification submitted</option><option value="ALL">All statuses</option>
        </select></label>
        <label className="admin-filter-field"><span>Plan</span><select value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">All plans</option>{plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select></label>
        <label className="admin-filter-field"><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, district or state" /></label>
        <label className="admin-filter-field"><span>Joined from</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="admin-filter-field"><span>Joined to</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <button className="admin-primary-button" type="submit">Search</button>
      </form>
      {loading ? <div className="admin-empty"><LoaderCircle className="spin" size={30} /><strong>Loading merchants</strong><span>Retrieving the protected merchant queue.</span></div> : error ? <div className="admin-empty"><ShieldAlert size={30} /><strong>Merchant queue unavailable</strong><span>{error}</span><button type="button" onClick={() => void load(meta.page)}>Try again</button></div> : <div className="admin-record-list">
        {rows.map((merchant) => { const location = merchant.locations[0]; return <article key={merchant.id}>
          <span className="admin-record-icon"><Building2 size={20} /></span><div className="admin-record-copy"><div className="admin-record-meta"><span className={`admin-status admin-status-${merchant.status.toLowerCase()}`}>{merchant.status.replaceAll("_", " ")}</span>{location && <span><MapPin size={14} /> {[location.locality, location.city, location.district].filter(Boolean).join(", ")}</span>}{merchant.subscriptions[0] && <span>{merchant.subscriptions[0].plan.name}</span>}</div><h2>{merchant.name}</h2><p>{merchant.owner.legalName} · {merchant.email || merchant.publicPhone || "No public contact"}</p><small>{merchant.profileCompleteness}% profile complete · Joined {new Date(merchant.createdAt).toLocaleDateString("en-IN")}</small></div><Link className="admin-primary-link" href={`/admin/merchants/${encodeURIComponent(merchant.id)}`}>Review merchant</Link>
        </article>; })}
        {!rows.length && <div className="admin-empty"><Building2 size={30} /><strong>No merchants found</strong><span>No merchant accounts match the selected status and search.</span></div>}
      </div>}
      <footer><span>{meta.total} merchants · page {meta.page} of {pages}</span><div><button type="button" disabled={loading || meta.page <= 1} onClick={() => void load(meta.page - 1)}><ChevronLeft size={15} /> Previous</button><button type="button" disabled={loading || meta.page >= pages} onClick={() => void load(meta.page + 1)}>Next <ChevronRight size={15} /></button></div></footer>
    </section>
  </DashboardShell>;
}
