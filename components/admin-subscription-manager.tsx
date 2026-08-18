"use client";

import { CheckCircle2, Clock3, LoaderCircle, Plus, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Plan = { id: string; name: string; isActive: boolean };
type Subscription = {
  id: string; status: string; billingCycle: string; startsAt: string; currentPeriodEnd: string;
  renewalStatus: string; autoRenew: boolean; source: string; paymentStatus: string;
  plan: Plan; business: { id: string; name: string; owner: { user: { email: string | null; phone: string | null } } };
  payments: Array<{ id: string; amount: string | number; status: string; provider: string; createdAt: string }>;
};

function errorMessage(body: { message?: string | string[]; error?: { message?: string | string[] } } | null, fallback: string) {
  const message = body?.message ?? body?.error?.message;
  return Array.isArray(message) ? message.join(" ") : message ?? fallback;
}

export function AdminSubscriptionManager({ user }: { user: BncSessionUser }) {
  const [records, setRecords] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query.trim()) params.set("q", query.trim()); if (status) params.set("status", status); if (paymentStatus) params.set("paymentStatus", paymentStatus);
      const [subscriptionsResponse, plansResponse] = await Promise.all([fetch(appPath(`/api/admin/subscriptions?${params}`)), fetch(appPath("/api/admin/subscription-plans"))]);
      const subscriptionsBody = await subscriptionsResponse.json() as { data?: Subscription[]; meta?: { total: number }; message?: string | string[] };
      const plansBody = await plansResponse.json() as { data?: Plan[]; message?: string | string[] };
      if (!subscriptionsResponse.ok) throw new Error(errorMessage(subscriptionsBody, "Subscriptions could not be loaded."));
      if (!plansResponse.ok) throw new Error(errorMessage(plansBody, "Plans could not be loaded."));
      setRecords(subscriptionsBody.data ?? []); setTotal(subscriptionsBody.meta?.total ?? 0); setPlans(plansBody.data ?? []);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Subscriptions could not be loaded."); }
    finally { setLoading(false); }
  }, [page, paymentStatus, query, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  async function assign(form: HTMLFormElement) {
    const data = new FormData(form); setBusy(true); setNotice("");
    try {
      const response = await fetch(appPath("/api/admin/subscriptions"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessId: data.get("businessId"), planId: data.get("planId"), billingCycle: data.get("billingCycle"), durationDays: Number(data.get("durationDays")), reason: data.get("reason") }) });
      const body = await response.json().catch(() => null) as { message?: string | string[]; error?: { message?: string | string[] } } | null;
      if (!response.ok) throw new Error(errorMessage(body, "Subscription could not be assigned."));
      setAssigning(false); setNotice("Plan assigned as an audited admin grant. No payment was marked paid."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Subscription could not be assigned."); }
    finally { setBusy(false); }
  }

  async function action(form: HTMLFormElement) {
    if (!selected) return; const data = new FormData(form); const actionName = String(data.get("action")); setBusy(true); setNotice("");
    try {
      const response = await fetch(appPath(`/api/admin/subscriptions/${selected.id}`), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: actionName, planId: data.get("planId") || undefined, extendDays: data.get("extendDays") ? Number(data.get("extendDays")) : undefined, reason: data.get("reason") }) });
      const body = await response.json().catch(() => null) as { message?: string | string[]; error?: { message?: string | string[] } } | null;
      if (!response.ok) throw new Error(errorMessage(body, "Subscription could not be updated."));
      setSelected(null); setNotice("Subscription updated and recorded in the immutable audit log. Payment state was unchanged."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Subscription could not be updated."); }
    finally { setBusy(false); }
  }

  return <DashboardShell mode="admin" user={user}>
    <section className="manager-heading"><div><span className="eyebrow">Renewals and payment state</span><h1>Merchant subscriptions</h1><p>Inspect plan access, expiry, renewal intent and provider-confirmed payment history.</p></div><button type="button" onClick={() => setAssigning(true)}><Plus size={16} /> Assign plan</button></section>
    <section className="admin-filter-bar"><label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Business, email or phone" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All subscription states</option>{["PENDING_PAYMENT", "TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "PAUSED", "CANCELLED", "EXPIRED"].map((value) => <option key={value}>{value}</option>)}</select><select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }}><option value="">All payment states</option>{["pending", "paid", "failed", "refunded", "cancelled"].map((value) => <option key={value}>{value}</option>)}</select><button type="button" onClick={() => void load()} aria-label="Refresh"><RefreshCw size={16} /></button></section>
    {notice && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {notice}</p>}
    <section className="manager-table-card"><header><div><strong>{total} subscriptions</strong><span>Page {page} · {pageSize} records per page</span></div><span><ShieldCheck size={15} /> Provider paid states are read-only</span></header>{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading subscriptions</strong></div> : records.length === 0 ? <div className="admin-empty"><Clock3 size={28} /><strong>No subscriptions found</strong><span>Adjust the filters or assign an authorized plan grant.</span></div> : <div className="admin-subscription-table"><table><thead><tr><th>Merchant</th><th>Plan</th><th>Access</th><th>Renewal</th><th>Payment</th><th>Expires</th><th /></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.business.name}</strong><small>{record.business.owner.user.email ?? record.business.owner.user.phone ?? record.business.id}</small></td><td>{record.plan.name}<small>{record.billingCycle}</small></td><td><span className={`status-pill status-${record.status.toLowerCase()}`}>{record.status.replaceAll("_", " ")}</span><small>{record.source.replaceAll("_", " ")}</small></td><td>{record.renewalStatus.replaceAll("_", " ")}<small>{record.autoRenew ? "Auto-renew on" : "Auto-renew off"}</small></td><td><span className={`status-pill status-${record.paymentStatus}`}>{record.paymentStatus.replaceAll("_", " ")}</span><small>{record.payments[0]?.provider ?? "No payment"}</small></td><td>{new Date(record.currentPeriodEnd).toLocaleDateString("en-IN")}</td><td><button type="button" onClick={() => setSelected(record)}>Manage</button></td></tr>)}</tbody></table></div>}<footer className="admin-pagination"><button type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>{Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span><button type="button" disabled={page * pageSize >= total || loading} onClick={() => setPage((value) => value + 1)}>Next</button></footer></section>
    {assigning && <div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true"><header><div><small>Audited grant</small><h2>Assign merchant plan</h2></div><button onClick={() => setAssigning(false)}><X size={18} /></button></header><form onSubmit={(event) => { event.preventDefault(); void assign(event.currentTarget); }}><label>Business ID<input name="businessId" required /></label><label>Plan<select name="planId" required>{plans.filter((plan) => plan.isActive).map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select></label><label>Billing cycle<select name="billingCycle"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label><label>Access duration (days)<input name="durationDays" type="number" min="1" max="730" defaultValue="365" required /></label><label>Audit reason<textarea name="reason" minLength={5} maxLength={500} required /></label><p className="admin-safety-note"><ShieldCheck size={15} /> This creates an admin grant and does not create or mark a payment as paid.</p><footer><button type="button" className="secondary" onClick={() => setAssigning(false)}>Cancel</button><button disabled={busy}>{busy && <LoaderCircle className="spin" size={15} />} Assign</button></footer></form></section></div>}
    {selected && <div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true"><header><div><small>{selected.business.name}</small><h2>Manage {selected.plan.name}</h2></div><button onClick={() => setSelected(null)}><X size={18} /></button></header><form onSubmit={(event) => { event.preventDefault(); void action(event.currentTarget); }}><label>Action<select name="action" defaultValue="EXTEND"><option value="EXTEND">Extend access</option><option value="CHANGE_PLAN">Change plan</option><option value="REACTIVATE">Reactivate</option><option value="CANCEL">Cancel immediately</option></select></label><label>Replacement plan (for change plan)<select name="planId"><option value="">Keep current plan</option>{plans.filter((plan) => plan.isActive).map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select></label><label>Extension days<input name="extendDays" type="number" min="1" max="730" defaultValue="30" /></label><label>Audit reason<textarea name="reason" minLength={5} maxLength={500} required /></label><p className="admin-safety-note"><ShieldCheck size={15} /> Access changes are audited. Provider payment history remains immutable here.</p><footer><button type="button" className="secondary" onClick={() => setSelected(null)}>Close</button><button disabled={busy}>{busy && <LoaderCircle className="spin" size={15} />} Apply action</button></footer></form></section></div>}
  </DashboardShell>;
}
