"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type UserRow = { id: string; email: string | null; phone: string | null; role: string; status: string; createdAt: string; lastLoginAt: string | null; customerProfile: { displayName: string | null; defaultCity: string | null } | null };
type UserDetail = UserRow & { preferredLanguage: string; emailVerifiedAt: string | null; phoneVerifiedAt: string | null; _count: Record<string, number>; businessOwner: { businesses: Array<{ id: string; name: string; status: string; listingStatus: string }> } | null };

function messageOf(body: { message?: string | string[] } | null, fallback: string) {
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? fallback;
}

export function AdminUserManager({ user }: { user: BncSessionUser }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"success" | "error">("success");
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (submitted) params.set("q", submitted);
      const response = await fetch(appPath(`/api/admin/users?${params}`));
      const body = await response.json() as { data?: UserRow[]; meta?: { total: number }; message?: string | string[] };
      if (!response.ok) throw new Error(messageOf(body, "Users could not be loaded."));
      setRows(body.data ?? []);
      setTotal(body.meta?.total ?? 0);
      setNotice("");
    } catch (error) {
      setRows([]);
      setTotal(0);
      setNoticeKind("error");
      setNotice(error instanceof Error ? error.message : "Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [page, submitted]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSubmitted(query.trim());
  }

  async function open(id: string) {
    setBusy(true);
    try {
      const response = await fetch(appPath(`/api/admin/users/${encodeURIComponent(id)}`));
      const body = await response.json() as { data?: UserDetail; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(messageOf(body, "User could not be opened."));
      setSelected(body.data);
      setNotice("");
    } catch (error) {
      setNoticeKind("error");
      setNotice(error instanceof Error ? error.message : "User could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(form: HTMLFormElement) {
    if (!selected) return;
    const data = new FormData(form);
    const status = String(data.get("status") ?? "");
    if (!window.confirm(`${status === "SUSPENDED" ? "Suspend" : "Reactivate"} this user account?`)) return;
    setBusy(true);
    try {
      const response = await fetch(appPath(`/api/admin/users/${selected.id}/status`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, reason: data.get("reason") }),
      });
      const body = await response.json().catch(() => null) as { data?: UserDetail; message?: string | string[] } | null;
      if (!response.ok) throw new Error(messageOf(body, "User status could not be updated."));
      setSelected(null);
      await load();
      setNoticeKind("success");
      setNotice(status === "SUSPENDED" ? "User suspended and audit entry recorded." : "User reactivated and audit entry recorded.");
    } catch (error) {
      setNoticeKind("error");
      setNotice(error instanceof Error ? error.message : "User status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canChangeStatus = user.roles.includes("SUPER_ADMIN");

  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Account administration</span><h1>User management</h1><p>Search customer and merchant-owner accounts, inspect recorded activity, and apply audited account status changes.</p></div></section>
      <form className="admin-filter-bar" onSubmit={search}><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email or phone" /></label><button type="submit">Search</button></form>
      {notice && <p className={noticeKind === "error" ? "form-error" : "settings-saved"} role={noticeKind === "error" ? "alert" : "status"}>{noticeKind === "success" && <CheckCircle2 size={15} />} {notice}</p>}
      <section className="manager-table-card">
        <header><div><strong>{total} users</strong><span>Page {page} of {pages}</span></div><span><ShieldCheck size={15} /> Protected account directory</span></header>
        {loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading users</strong></div> : rows.length ? <div className="admin-user-list">{rows.map((row) => <article key={row.id}><span><UserRound size={18} /></span><div><strong>{row.customerProfile?.displayName || row.email || row.phone || "Unnamed user"}</strong><small>{row.email || row.phone} · {row.role.replaceAll("_", " ")} · Joined {new Date(row.createdAt).toLocaleDateString("en-IN")}</small></div><b className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</b><button type="button" onClick={() => void open(row.id)} disabled={busy}>View</button></article>)}</div> : <div className="admin-empty"><UserRound size={28} /><strong>No users found</strong><span>Try another name, email address, or phone number.</span></div>}
        <footer className="admin-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={14} /> Previous</button><span>{total ? Math.min((page - 1) * pageSize + 1, total) : 0}–{Math.min(page * pageSize, total)} of {total}</span><button type="button" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={14} /></button></footer>
      </section>
      {selected && <div className="admin-modal-backdrop"><section className="admin-modal admin-user-detail" role="dialog" aria-modal="true"><header><div><small>{selected.role.replaceAll("_", " ")}</small><h2>{selected.customerProfile?.displayName || selected.email || selected.phone}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close user details"><X size={18} /></button></header><dl><div><dt>Email</dt><dd>{selected.email || "—"}</dd></div><div><dt>Phone</dt><dd>{selected.phone || "—"}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Last login</dt><dd>{selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString("en-IN") : "Never"}</dd></div><div><dt>Enquiries</dt><dd>{selected._count.enquiries ?? 0}</dd></div><div><dt>Reviews</dt><dd>{selected._count.reviews ?? 0}</dd></div></dl>{selected.businessOwner?.businesses.length ? <div className="admin-user-businesses"><strong>Merchant listings</strong>{selected.businessOwner.businesses.map((business) => <span key={business.id}>{business.name} · {business.status} · {business.listingStatus}</span>)}</div> : null}{canChangeStatus ? <form onSubmit={(event) => { event.preventDefault(); void updateStatus(event.currentTarget); }}><label>Account status<select name="status" defaultValue={selected.status}><option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="SUSPENDED">Suspended</option></select></label><label>Audit reason<textarea name="reason" minLength={8} maxLength={500} required /></label><footer><button className="secondary" type="button" onClick={() => setSelected(null)}>Close</button><button disabled={busy}>{busy && <LoaderCircle className="spin" size={14} />} Save status</button></footer></form> : <p className="admin-existing-note"><ShieldCheck size={15} /> Account status changes require super-administrator access.</p>}</section></div>}
    </DashboardShell>
  );
}
