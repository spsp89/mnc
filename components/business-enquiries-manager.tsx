"use client";

import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Inbox, LoaderCircle, MapPin, MessageSquareText, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED", "SPAM"] as const;
type MerchantStatus = typeof statuses[number];
type BusinessEnquiry = {
  id: string; requirement: string; location: { locality?: string; city?: string } | null; preferredDate: string | null;
  urgency: string | null; customerName: string | null; contactPreference: string; createdAt: string; expiresAt: string;
  source: string; merchantStatus: MerchantStatus; contactAvailable: boolean; assignmentId: string | null; assignmentStatus: string | null;
  listing: { id: string; name: string; slug: string }; category: { id: string; name: string; slug: string };
};
type EnquiryDetail = BusinessEnquiry & { contact: { phone?: string; preference?: string } | null; items: Array<{ id: string; quantity: number | null; product?: { name: string } | null; service?: { name: string } | null; details: unknown }> };

function readable(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function apiMessage(body: { message?: string | string[] } | null, fallback: string) { return Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? fallback; }

export function BusinessEnquiriesManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [rows, setRows] = useState<BusinessEnquiry[]>([]);
  const [query, setQuery] = useState(""); const [status, setStatus] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const pageSize = 25;
  const [selected, setSelected] = useState<EnquiryDetail | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId); const canManage = workspace?.capabilities.includes("business:leads:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId) { setRows([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ businessId, page: String(page), pageSize: String(pageSize) });
      if (query.trim()) params.set("q", query.trim()); if (status) params.set("status", status); if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString()); if (to) params.set("to", new Date(`${to}T23:59:59.999`).toISOString());
      const response = await fetch(appPath(`/api/business/enquiries?${params}`));
      const body = await response.json() as { data?: BusinessEnquiry[]; meta?: { total: number }; message?: string | string[] };
      if (!response.ok) throw new Error(apiMessage(body, "Enquiries could not be loaded."));
      setRows(body.data ?? []); setTotal(body.meta?.total ?? 0);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enquiries could not be loaded."); }
    finally { setLoading(false); }
  }, [businessId, from, page, query, status, to]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  async function open(row: BusinessEnquiry) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/enquiries/${encodeURIComponent(row.id)}?businessId=${encodeURIComponent(businessId)}`));
      const body = await response.json() as { data?: EnquiryDetail; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(apiMessage(body, "Enquiry could not be opened."));
      setSelected(body.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enquiry could not be opened."); }
    finally { setBusy(false); }
  }

  async function updateStatus(nextStatus: MerchantStatus) {
    if (!selected) return; setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/enquiries/${selected.id}/status`), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessId, status: nextStatus }) });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(apiMessage(body, "Enquiry status could not be updated."));
      setSelected({ ...selected, merchantStatus: nextStatus }); setMessage(`Enquiry marked ${readable(nextStatus)}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enquiry status could not be updated."); }
    finally { setBusy(false); }
  }

  async function acceptMatchedLead() {
    if (!selected?.assignmentId) return; setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/leads/${encodeURIComponent(selected.assignmentId)}/accept`), { method: "POST" });
      const body = await response.json().catch(() => null) as { data?: { contact?: { phone?: string; preference?: string } }; message?: string | string[] } | null;
      if (!response.ok) throw new Error(apiMessage(body, "Matched lead could not be accepted."));
      setSelected({ ...selected, assignmentStatus: "ACCEPTED", contactAvailable: true, contact: body?.data?.contact ?? null });
      setMessage("Lead accepted. Consent-scoped contact information is now available."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Matched lead could not be accepted."); }
    finally { setBusy(false); }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <DashboardShell mode="business" user={user}>
    <section className="manager-heading"><div><span className="eyebrow">Customer pipeline</span><h1>Leads and enquiries</h1><p>Search received customer intent, open consent-safe contact detail, and maintain a listing-specific sales status.</p></div></section>
    <section className="admin-filter-bar merchant-enquiry-filters"><label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Customer, requirement or category" /></label><select aria-label="Listing" value={businessId} onChange={(event) => { setBusinessId(event.target.value); setPage(1); }}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select><select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map((value) => <option value={value} key={value}>{readable(value)}</option>)}</select><input aria-label="From date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /><input aria-label="To date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></section>
    {message && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {message}</p>}
    <section className="manager-table-card"><header><div><strong>{total} received enquiries</strong><span>Page {page} of {pages}</span></div><span><ShieldCheck size={15} /> Scoped to {workspace?.name ?? "selected listing"}</span></header>{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading enquiries</strong></div> : rows.length ? <div className="business-enquiry-records">{rows.map((enquiry) => <article key={enquiry.id}><div className="business-record-status"><span data-status={enquiry.merchantStatus}>{readable(enquiry.merchantStatus)}</span><small>{readable(enquiry.source)}</small></div><div className="business-record-body"><small><UserRound size={13} /> {enquiry.customerName || "BNC customer"} · {enquiry.category.name}</small><h2>{enquiry.requirement}</h2><div className="business-record-meta"><span><MapPin size={13} /> {[enquiry.location?.locality, enquiry.location?.city].filter(Boolean).join(", ") || "Location shared privately"}</span><span><MessageSquareText size={13} /> {enquiry.contactAvailable ? `Contact available · ${readable(enquiry.contactPreference)}` : "Accept matched lead to reveal contact"}</span><span><CalendarClock size={13} /> {new Date(enquiry.createdAt).toLocaleString("en-IN")}</span></div></div><button type="button" onClick={() => void open(enquiry)} disabled={busy}>Open</button></article>)}</div> : <div className="admin-empty"><Inbox size={28} /><strong>No enquiries found</strong><span>No received enquiries match these filters.</span></div>}<footer className="admin-pagination"><button disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={14} /> Previous</button><span>{Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span><button disabled={loading || page >= pages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={14} /></button></footer></section>
    {selected && <div className="admin-modal-backdrop"><section className="admin-modal merchant-enquiry-detail" role="dialog" aria-modal="true"><header><div><small>{selected.listing.name} · {readable(selected.source)}</small><h2>{selected.customerName || "BNC customer"}</h2></div><button onClick={() => setSelected(null)}><X size={18} /></button></header><div className="merchant-enquiry-message"><strong>Customer message</strong><p>{selected.requirement}</p></div><dl><div><dt>Category</dt><dd>{selected.category.name}</dd></div><div><dt>Received</dt><dd>{new Date(selected.createdAt).toLocaleString("en-IN")}</dd></div><div><dt>Preferred contact</dt><dd>{readable(selected.contactPreference)}</dd></div><div><dt>Contact</dt><dd>{selected.contact?.phone ?? (selected.contactAvailable ? "Available" : "Protected until accepted")}</dd></div><div><dt>Location</dt><dd>{[selected.location?.locality, selected.location?.city].filter(Boolean).join(", ") || "—"}</dd></div><div><dt>Assignment</dt><dd>{selected.assignmentStatus ? readable(selected.assignmentStatus) : "Direct"}</dd></div></dl>{canManage && !selected.contactAvailable && selected.assignmentId && <button type="button" onClick={() => void acceptMatchedLead()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <ShieldCheck size={14} />} Accept lead and reveal contact</button>}{canManage && <label>Pipeline status<select value={selected.merchantStatus} disabled={busy} onChange={(event) => void updateStatus(event.target.value as MerchantStatus)}>{statuses.map((value) => <option value={value} key={value}>{readable(value)}</option>)}</select></label>}</section></div>}
  </DashboardShell>;
}
