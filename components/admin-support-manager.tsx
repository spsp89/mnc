"use client";

import { CheckCircle2, CircleHelp, Mail, Phone, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { appPath } from "@/lib/client-routing";

type SupportTicket = {
  id: string;
  ticketNumber: string;
  assignedToId: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string | null; phone: string | null } | null;
};

type Draft = { status: string; priority: string; note: string; assignToMe: boolean };
const openStatuses = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"];

function ticketItems(payload: unknown): SupportTicket[] {
  return Array.isArray(payload) ? payload as SupportTicket[] : [];
}

export function AdminSupportManager({ payload }: { payload: unknown }) {
  const initial = useMemo(() => ticketItems(payload), [payload]);
  const [tickets, setTickets] = useState(initial);
  const [query, setQuery] = useState("");
  const [showOpen, setShowOpen] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(initial.map((ticket) => [ticket.id, { status: ticket.status, priority: ticket.priority, note: "", assignToMe: false }])));
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tickets.filter((ticket) => (!showOpen || openStatuses.includes(ticket.status)) && (!needle || `${ticket.ticketNumber} ${ticket.subject} ${ticket.category} ${ticket.user?.email || ""}`.toLowerCase().includes(needle)));
  }, [query, showOpen, tickets]);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function save(ticket: SupportTicket) {
    const draft = drafts[ticket.id];
    if (!draft || draft.note.trim().length < 8) {
      setMessage("Add an internal resolution note of at least 8 characters.");
      return;
    }
    setBusyId(ticket.id);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/support/${ticket.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: draft.status, priority: draft.priority, note: draft.note.trim(), assignToMe: draft.assignToMe }),
      });
      const body = (await response.json()) as { data?: SupportTicket; message?: string | string[] };
      if (!response.ok || !body.data) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Support ticket could not be updated.");
      }
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, ...body.data } : item));
      updateDraft(ticket.id, { status: body.data.status, priority: body.data.priority, note: "", assignToMe: false });
      setMessage(`${ticket.ticketNumber} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Support ticket could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="admin-support-workspace">
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {message}</p>}
      <div className="admin-operation-tools admin-support-tools">
        <label><Search size={17} /><span className="sr-only">Search support tickets</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, subject, category, or customer" /></label>
        <label className="admin-checkbox"><input type="checkbox" checked={showOpen} onChange={(event) => setShowOpen(event.target.checked)} /> Open work only</label>
      </div>
      <div className="admin-support-list">
        {filtered.map((ticket) => {
          const draft = drafts[ticket.id];
          return (
            <article key={ticket.id}>
              <header>
                <span><CircleHelp size={21} /></span>
                <div><div className="admin-record-meta"><span className={`admin-status admin-status-${ticket.status.toLowerCase()}`}>{ticket.status.replaceAll("_", " ")}</span><span>{ticket.priority} priority</span><span>{ticket.category}</span></div><h2>{ticket.subject}</h2><p>{ticket.ticketNumber} · Opened {new Date(ticket.createdAt).toLocaleString("en-IN")}</p></div>
              </header>
              <p className="admin-ticket-description">{ticket.description}</p>
              <div className="admin-ticket-contact">
                <span><Mail size={15} /> {ticket.user?.email || "Guest ticket"}</span>
                {ticket.user?.phone && <span><Phone size={15} /> {ticket.user.phone}</span>}
                <span>{ticket.assignedToId ? "Assigned" : "Unassigned"}</span>
              </div>
              <div className="admin-ticket-controls">
                <label>Status<select value={draft?.status ?? ticket.status} onChange={(event) => updateDraft(ticket.id, { status: event.target.value })}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="WAITING_CUSTOMER">Waiting for customer</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></label>
                <label>Priority<select value={draft?.priority ?? ticket.priority} onChange={(event) => updateDraft(ticket.id, { priority: event.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
                <label className="admin-checkbox"><input type="checkbox" checked={draft?.assignToMe ?? false} onChange={(event) => updateDraft(ticket.id, { assignToMe: event.target.checked })} /> Assign to me</label>
              </div>
              <label className="admin-decision-note">Internal resolution note<textarea rows={2} minLength={8} maxLength={1000} value={draft?.note ?? ""} onChange={(event) => updateDraft(ticket.id, { note: event.target.value })} placeholder="Explain the status or priority change" /></label>
              <footer><button type="button" className="admin-primary-button" disabled={busyId === ticket.id} onClick={() => void save(ticket)}><Save size={16} /> {busyId === ticket.id ? "Saving…" : "Save ticket"}</button></footer>
            </article>
          );
        })}
        {!filtered.length && <div className="admin-empty"><CheckCircle2 size={31} /><strong>No support tickets match</strong><span>Change the search or include resolved tickets.</span></div>}
      </div>
    </section>
  );
}
