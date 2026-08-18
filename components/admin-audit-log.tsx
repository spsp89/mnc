"use client";

import { ChevronLeft, ChevronRight, Download, Eye, FileClock, FileLock2, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

type JsonRecord = Record<string, unknown>;
type AuditEntry = {
  id: string;
  actorId?: string | null;
  actor?: { id: string; email?: string | null; role?: string | null } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  requestId: string;
  previousHash?: string | null;
  entryHash: string;
  createdAt: string;
};
type AuditPayload = { data?: AuditEntry[]; meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number } };

const asPayload = (value: JsonRecord | JsonRecord[] | null): AuditPayload =>
  value && !Array.isArray(value) ? value as AuditPayload : { data: [] };
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const jsonText = (value: unknown) => value === null || value === undefined ? "No value" : JSON.stringify(value, null, 2);

export function AdminAuditLog({ payload }: { payload: JsonRecord | JsonRecord[] | null }) {
  const initial = asPayload(payload);
  const [entries, setEntries] = useState<AuditEntry[]>(initial.data ?? []);
  const [meta, setMeta] = useState({
    page: initial.meta?.page ?? 1,
    pageSize: initial.meta?.pageSize ?? 100,
    total: initial.meta?.total ?? initial.data?.length ?? 0,
    totalPages: initial.meta?.totalPages ?? Math.max(1, Math.ceil((initial.meta?.total ?? initial.data?.length ?? 0) / (initial.meta?.pageSize ?? 100))),
  });
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("ALL");
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const entityTypes = useMemo(() => [...new Set(entries.map((entry) => entry.entityType))].sort(), [entries]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (entityType !== "ALL" && entry.entityType !== entityType) return false;
      return !needle || [entry.action, entry.entityType, entry.entityId, entry.reason, entry.actor?.email, entry.actor?.role]
        .some((value) => value?.toLowerCase().includes(needle));
    });
  }, [entries, entityType, query]);

  const loadPage = async (page: number) => {
    if (page < 1 || page > meta.totalPages || page === meta.page) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/audit-log?page=${page}`, { credentials: "same-origin" });
      const body = await response.json() as AuditPayload & { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message || "Audit log could not be loaded.");
      setEntries(body.data ?? []);
      setMeta({
        page: body.meta?.page ?? page,
        pageSize: body.meta?.pageSize ?? meta.pageSize,
        total: body.meta?.total ?? 0,
        totalPages: body.meta?.totalPages ?? Math.max(1, Math.ceil((body.meta?.total ?? 0) / (body.meta?.pageSize ?? meta.pageSize))),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audit log could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const fields = ["timestamp", "administrator", "role", "action", "entity", "entityId", "reason", "oldValue", "newValue", "requestId", "entryHash"];
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = visible.map((entry) => [entry.createdAt, entry.actor?.email || entry.actorId || "System", entry.actor?.role || "SYSTEM", entry.action, entry.entityType, entry.entityId, entry.reason, jsonText(entry.before), jsonText(entry.after), entry.requestId, entry.entryHash]);
    const csv = [fields, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bnc-audit-log-page-${meta.page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-audit-card" aria-label="Administrative audit log">
      <div className="admin-audit-toolbar">
        <label><Search size={18} aria-hidden="true" /><span className="sr-only">Search audit log</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, administrator, entity or reason" /></label>
        <select aria-label="Filter by entity type" value={entityType} onChange={(event) => setEntityType(event.target.value)}><option value="ALL">All entities</option>{entityTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select>
        <button type="button" onClick={exportCsv} disabled={!visible.length}><Download size={16} /> Export page</button>
      </div>
      <div className="admin-audit-integrity"><FileLock2 size={18} /><div><strong>Immutable audit evidence</strong><span>Entries are hash-chained and read-only. Sensitive credentials are redacted from old and new values.</span></div></div>
      {error ? <p className="admin-dialog-error" role="alert">{error}</p> : null}
      {loading ? <div className="admin-audit-empty"><FileClock className="spin" size={28} /><strong>Loading audit evidence</strong></div>
        : visible.length ? <div className="admin-audit-table-wrap"><table className="admin-audit-table"><thead><tr><th>Timestamp</th><th>Administrator</th><th>Action</th><th>Entity</th><th>Reason</th><th><span className="sr-only">Inspect</span></th></tr></thead><tbody>{visible.map((entry) => <tr key={entry.id}>
          <td><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("en-IN")}</time></td>
          <td><strong>{entry.actor?.email || entry.actorId || "System"}</strong><small>{label(entry.actor?.role || "SYSTEM")}</small></td>
          <td><span className="admin-audit-action">{label(entry.action)}</span></td>
          <td><strong>{label(entry.entityType)}</strong><small>{entry.entityId || "—"}</small></td>
          <td>{entry.reason || "No reason recorded"}</td>
          <td><button type="button" onClick={() => setSelected(entry)}><Eye size={15} /> Inspect</button></td>
        </tr>)}</tbody></table></div>
          : <div className="admin-audit-empty"><ShieldCheck size={28} /><strong>No audit entries match</strong><span>Clear the search or entity filter.</span></div>}
      <footer><span>Showing {visible.length} of {entries.length} entries on page {meta.page} · {meta.total} total</span><div><button type="button" disabled={loading || meta.page <= 1} onClick={() => void loadPage(meta.page - 1)}><ChevronLeft size={16} /> Previous</button><span>{meta.page} / {meta.totalPages}</span><button type="button" disabled={loading || meta.page >= meta.totalPages} onClick={() => void loadPage(meta.page + 1)}>Next <ChevronRight size={16} /></button></div></footer>
      {selected ? <div className="admin-dialog-backdrop" role="presentation"><section className="admin-record-dialog admin-audit-dialog" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title"><header><div><span className="eyebrow">Immutable audit evidence</span><h2 id="audit-detail-title">{label(selected.action)}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close audit details"><X size={20} /></button></header><div className="admin-audit-detail-meta"><div><span>Administrator</span><strong>{selected.actor?.email || selected.actorId || "System"}</strong></div><div><span>Entity</span><strong>{selected.entityType} · {selected.entityId || "—"}</strong></div><div><span>Reason</span><strong>{selected.reason || "No reason recorded"}</strong></div><div><span>Timestamp</span><strong>{new Date(selected.createdAt).toLocaleString("en-IN")}</strong></div></div><div className="admin-audit-diff"><section><h3>Old value</h3><pre>{jsonText(selected.before)}</pre></section><section><h3>New value</h3><pre>{jsonText(selected.after)}</pre></section></div><div className="admin-audit-chain"><span>Request ID <code>{selected.requestId}</code></span><span>Previous hash <code>{selected.previousHash || "Chain origin"}</code></span><span>Entry hash <code>{selected.entryHash}</code></span></div><footer><button type="button" onClick={() => setSelected(null)}>Close</button></footer></section></div> : null}
    </section>
  );
}
