"use client";

import { ArrowLeft, Building2, CheckCircle2, LoaderCircle, MapPin, ShieldAlert, ShieldCheck, Store, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath, readJsonResponse } from "@/lib/client-routing";

type MerchantDetail = {
  id: string; name: string; legalName: string | null; slug: string; description: string; shortDescription: string | null;
  status: string; verified: boolean; email: string | null; publicPhone: string | null; profileCompleteness: number;
  owner: { legalName: string; user: { email: string | null; phone: string | null; status: string } };
  locations: Array<{ id: string; label: string | null; addressLine1: string; addressLine2: string | null; locality: string; city: string; district: string; state: string; postalCode: string; isPrimary: boolean }>;
  categories: Array<{ isPrimary: boolean; category: { name: string } }>;
  subscriptions: Array<{ status: string; currentPeriodEnd: string; plan: { name: string } }>;
  verificationRequests: Array<{ id: string; status: string; notes: string | null; rejectionReason: string | null; createdAt: string }>;
  audit: Array<{ id: string; action: string; reason: string | null; createdAt: string; actor: { email: string | null } | null }>;
  _count: Record<string, number>;
};

const actionForStatus: Record<string, Array<{ action: "APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE"; label: string; danger?: boolean }>> = {
  DRAFT: [{ action: "APPROVE", label: "Approve" }, { action: "REJECT", label: "Reject", danger: true }],
  PENDING_VERIFICATION: [{ action: "APPROVE", label: "Approve" }, { action: "REJECT", label: "Reject", danger: true }],
  REJECTED: [{ action: "APPROVE", label: "Approve after correction" }],
  ACTIVE: [{ action: "SUSPEND", label: "Suspend", danger: true }],
  SUSPENDED: [{ action: "REACTIVATE", label: "Reactivate" }],
};

export function AdminMerchantDetail({ user, merchantId }: { user: BncSessionUser; merchantId: string }) {
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  const canDecide = user.roles.some((role) => ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "VERIFICATION"].includes(role));

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(appPath(`/api/admin/merchants/${encodeURIComponent(merchantId)}`));
      const body = await readJsonResponse<{ data?: MerchantDetail; message?: string | string[] }>(response, "Merchant detail returned an unreadable response.");
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Merchant detail could not be loaded.");
      setMerchant(body.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Merchant detail could not be loaded."); }
    finally { setLoading(false); }
  }, [merchantId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function act(action: "APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE") {
    if (reason.trim().length < 8) { setError("Enter an audit reason of at least 8 characters."); return; }
    setBusy(action); setError(""); setNotice("");
    try {
      const response = await fetch(appPath(`/api/admin/merchants/${encodeURIComponent(merchantId)}/status`), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, reason: reason.trim() }) });
      const body = await readJsonResponse<{ message?: string | string[] }>(response, "Merchant action returned an unreadable response.");
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Merchant status could not be updated.");
      setNotice(`Merchant ${action.toLowerCase()} action completed.`); setReason(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Merchant status could not be updated."); }
    finally { setBusy(""); }
  }

  return <DashboardShell mode="admin" user={user}>
    <Link className="admin-back-link" href="/admin/merchants"><ArrowLeft size={15} /> Merchant queue</Link>
    {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={30} /><strong>Loading merchant</strong><span>Retrieving profile, verification, and account history.</span></div></section> : error && !merchant ? <section className="manager-table-card"><div className="admin-empty"><ShieldAlert size={30} /><strong>Merchant unavailable</strong><span>{error}</span><button type="button" onClick={() => void load()}>Try again</button></div></section> : merchant && <>
      <section className="manager-heading admin-section-heading"><div><span className="eyebrow">Merchant {merchant.id}</span><h1>{merchant.name}</h1><p>{merchant.shortDescription || merchant.description}</p></div><span className={`admin-status admin-status-${merchant.status.toLowerCase()}`}>{merchant.status.replaceAll("_", " ")}</span></section>
      {notice && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {notice}</p>}{error && <p className="form-error" role="alert"><ShieldAlert size={16} /> {error}</p>}
      <div className="admin-verification-layout"><div className="admin-verification-evidence">
        <section><header><Building2 size={20} /><div><small>Business identity</small><h2>{merchant.legalName || merchant.name}</h2></div></header><dl><div><dt>Owner / contact</dt><dd>{merchant.owner.legalName}</dd></div><div><dt>Account</dt><dd>{merchant.owner.user.email || merchant.owner.user.phone}</dd></div><div><dt>Business email</dt><dd>{merchant.email || "Not provided"}</dd></div><div><dt>Business phone</dt><dd>{merchant.publicPhone || "Not provided"}</dd></div><div><dt>Profile completeness</dt><dd>{merchant.profileCompleteness}%</dd></div><div><dt>Verified</dt><dd>{merchant.verified ? "Yes" : "No"}</dd></div></dl></section>
        <section><header><MapPin size={20} /><div><small>Primary address</small><h2>{merchant.locations[0]?.city || "No location"}</h2></div></header>{merchant.locations[0] ? <address>{[merchant.locations[0].addressLine1, merchant.locations[0].addressLine2, merchant.locations[0].locality, merchant.locations[0].city, merchant.locations[0].district, merchant.locations[0].state, merchant.locations[0].postalCode].filter(Boolean).join(", ")}</address> : <p>No location has been supplied.</p>}</section>
        <section><header><Store size={20} /><div><small>Business activity</small><h2>Workspace summary</h2></div></header><dl>{Object.entries(merchant._count).map(([label, value]) => <div key={label}><dt>{label.replaceAll("_", " ")}</dt><dd>{value}</dd></div>)}<div><dt>Categories</dt><dd>{merchant.categories.map((item) => item.category.name).join(", ") || "None"}</dd></div><div><dt>Plan</dt><dd>{merchant.subscriptions[0]?.plan.name || "No subscription"}</dd></div></dl></section>
        <section><header><ShieldCheck size={20} /><div><small>Audit history</small><h2>Recent merchant decisions</h2></div></header>{merchant.audit.length ? <dl>{merchant.audit.map((item) => <div key={item.id}><dt>{item.action.replaceAll("_", " ")} · {new Date(item.createdAt).toLocaleString("en-IN")}</dt><dd>{item.reason || "No reason"} · {item.actor?.email || "Administrator"}</dd></div>)}</dl> : <p>No merchant status decisions have been recorded.</p>}</section>
      </div><aside className="admin-verification-decision"><header><ShieldCheck size={22} /><div><small>RBAC protected</small><h2>Merchant status</h2></div></header>{canDecide && (actionForStatus[merchant.status]?.length ?? 0) > 0 ? <><label>Decision reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} maxLength={1000} rows={5} placeholder="Record the evidence and reason for this decision" /></label><div className="admin-verification-actions">{(actionForStatus[merchant.status] ?? []).map((item) => <button type="button" className={item.danger ? "admin-danger-button" : "admin-primary-button"} disabled={Boolean(busy)} onClick={() => void act(item.action)} key={item.action}>{item.danger ? <XCircle size={16} /> : <CheckCircle2 size={16} />}{busy === item.action ? "Working…" : item.label}</button>)}</div></> : <p>{canDecide ? "No status action is available for this account." : "Your admin role has read-only access to merchant details."}</p>}</aside></div>
    </>}
  </DashboardShell>;
}
