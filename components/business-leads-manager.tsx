"use client";

import { CheckCircle2, Handshake, LoaderCircle, Phone, Plus, UserRoundCheck, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type LeadAssignment = {
  id: string;
  status: string;
  matchScore: number | string;
  distanceKm: number | string | null;
  creditCost: number;
  expiresAt: string;
  contact?: { name?: string; phone?: string; email?: string } | null;
  lead: {
    requirement: string;
    approximateLocation: unknown;
    urgency: string;
    createdAt: string;
    category: { name: string; slug: string };
  };
};

type Referral = {
  id: string;
  contactName: string;
  referredBusiness: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  estimatedValue: number | string | null;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
  createdAt: string;
};

function formatApproximateLocation(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Nearby customer";

  const location = value as Record<string, unknown>;
  const parts = ["locality", "city", "district", "state"]
    .map((key) => location[key])
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim());

  return [...new Set(parts)].join(", ") || "Nearby customer";
}

export function BusinessLeadsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [leads, setLeads] = useState<LeadAssignment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tab, setTab] = useState<"leads" | "referrals">("leads");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((business) => business.id === businessId);
  const canManage = workspace?.capabilities.includes("business:leads:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId) {
      setLeads([]);
      setReferrals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [leadResponse, referralResponse] = await Promise.all([
        fetch(appPath(`/api/business/leads?businessId=${encodeURIComponent(businessId)}`)),
        fetch(appPath(`/api/business/referrals?businessId=${encodeURIComponent(businessId)}`)),
      ]);
      const [leadBody, referralBody] = await Promise.all([
        leadResponse.json() as Promise<{ data?: LeadAssignment[]; message?: string | string[] }>,
        referralResponse.json() as Promise<{ data?: Referral[]; message?: string | string[] }>,
      ]);
      if (!leadResponse.ok) throw new Error(Array.isArray(leadBody.message) ? leadBody.message.join(" ") : leadBody.message ?? "Leads could not be loaded.");
      if (!referralResponse.ok) throw new Error(Array.isArray(referralBody.message) ? referralBody.message.join(" ") : referralBody.message ?? "Referrals could not be loaded.");
      setLeads(leadBody.data ?? []);
      setReferrals(referralBody.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead console could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function decide(assignmentId: string, action: "accept" | "decline") {
    if (action === "decline" && !window.confirm("Decline this lead? It will be removed from the active queue.")) return;
    setBusyId(assignmentId);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/leads/${assignmentId}/${action}`), { method: "POST" });
      const body = (await response.json()) as {
        data?: LeadAssignment & { assignmentId?: string; contact?: LeadAssignment["contact"] };
        message?: string | string[];
      };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Lead could not be updated.");
      if (action === "decline") {
        setLeads((current) => current.filter((lead) => lead.id !== assignmentId));
        setMessage("Lead declined and removed from the active queue.");
      } else {
        setLeads((current) => current.map((lead) => lead.id === assignmentId ? { ...lead, status: "ACCEPTED", contact: body.data?.contact ?? null } : lead));
        setMessage("Lead accepted. The customer contact is now available.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  async function createReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setBusyId("referral");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath("/api/business/referrals"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: workspace.id,
          contactName: form.get("contactName"),
          referredBusiness: form.get("referredBusiness") || undefined,
          phone: form.get("phone") || undefined,
          email: form.get("email") || undefined,
          notes: form.get("notes") || undefined,
          estimatedValue: form.get("estimatedValue") ? Number(form.get("estimatedValue")) : undefined,
        }),
      });
      const body = (await response.json()) as { data?: Referral; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Referral could not be saved.");
      if (body.data) setReferrals((current) => [body.data!, ...current]);
      setFormOpen(false);
      setMessage("Referral added to the console.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Referral could not be saved.");
    } finally {
      setBusyId("");
    }
  }

  async function updateReferral(id: string, status: Referral["status"]) {
    setBusyId(id);
    try {
      const response = await fetch(appPath(`/api/business/referrals/${id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Referral could not be updated.");
      setReferrals((current) => current.map((referral) => referral.id === id ? { ...referral, status } : referral));
      setMessage("Referral status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Referral could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Demand &amp; introductions</span><h1>Leads &amp; referrals</h1><p>Accept qualified customer demand, reveal contact details and track introductions through conversion.</p></div>
        <div className="business-product-heading-actions">
          {user.businesses.length > 1 && <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>}
          {tab === "referrals" && <button type="button" onClick={() => setFormOpen(true)} disabled={!canManage}><Plus size={15} /> Add referral</button>}
        </div>
      </section>
      <div className="manager-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "leads"} className={tab === "leads" ? "active" : ""} onClick={() => setTab("leads")}>Customer leads <span>{leads.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "referrals"} className={tab === "referrals" ? "active" : ""} onClick={() => setTab("referrals")}>Referrals <span>{referrals.length}</span></button>
      </div>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      <section className="manager-table-card">
        {loading ? (
          <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading lead console</strong></div>
        ) : tab === "leads" ? (
          leads.length ? <div className="manager-lead-list">
            {leads.map((lead) => (
              <article key={lead.id}>
                <span>{lead.status}</span>
                <div><small>{lead.lead.category.name} · {lead.lead.urgency}</small><h2>{lead.lead.requirement}</h2><p>{formatApproximateLocation(lead.lead.approximateLocation)}{lead.distanceKm !== null ? ` · ${Number(lead.distanceKm).toFixed(1)} km` : ""}</p>{lead.status === "ACCEPTED" && <div className="manager-lead-contact"><strong>{lead.contact?.name || "Customer contact"}</strong>{lead.contact?.phone && <a href={`tel:${lead.contact.phone}`}><Phone size={13} /> {lead.contact.phone}</a>}{lead.contact?.email && <a href={`mailto:${lead.contact.email}`}>{lead.contact.email}</a>}</div>}</div>
                <strong>{Math.round(Number(lead.matchScore))}%<small>match</small></strong>
                {lead.status === "ACCEPTED" ? <span className="manager-accepted"><UserRoundCheck size={15} /> Accepted</span> : <div className="manager-lead-actions"><button type="button" onClick={() => decide(lead.id, "accept")} disabled={busyId === lead.id}>Accept</button><button type="button" onClick={() => decide(lead.id, "decline")} disabled={busyId === lead.id}>Decline</button></div>}
              </article>
            ))}
          </div> : <div className="admin-empty"><Handshake size={28} /><strong>No active leads</strong><span>Automatic matches appear here when nearby customers search or submit a requirement.</span></div>
        ) : (
          referrals.length ? <div className="business-referral-list">
            {referrals.map((referral) => (
              <article key={referral.id}>
                <div><small>{referral.referredBusiness || "Personal introduction"}</small><h2>{referral.contactName}</h2><p>{referral.notes || "No notes added."}</p><span>{[referral.phone, referral.email].filter(Boolean).join(" · ")}</span></div>
                {referral.estimatedValue !== null && <strong>{formatCurrency(Number(referral.estimatedValue))}</strong>}
                <select value={referral.status} onChange={(event) => updateReferral(referral.id, event.target.value as Referral["status"])} disabled={busyId === referral.id}><option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="CONVERTED">Converted</option><option value="CLOSED">Closed</option></select>
              </article>
            ))}
          </div> : <div className="admin-empty"><Handshake size={28} /><strong>No referrals recorded</strong><span>Add business introductions and track their outcome without spreadsheets.</span><button type="button" onClick={() => setFormOpen(true)}><Plus size={15} /> Add referral</button></div>
        )}
      </section>

      {formOpen && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog" role="dialog" aria-modal="true" aria-labelledby="referral-form-title">
            <header><div><span className="eyebrow">New introduction</span><h2 id="referral-form-title">Add a referral</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={18} /></button></header>
            <form onSubmit={createReferral}>
              <label>Contact name<input name="contactName" minLength={2} maxLength={120} required /></label>
              <label>Business or organisation<input name="referredBusiness" maxLength={160} /></label>
              <div className="form-two-column"><label>Phone<input name="phone" maxLength={20} inputMode="tel" /></label><label>Email<input name="email" type="email" /></label></div>
              <label>Estimated value<input name="estimatedValue" type="number" min="0" step="0.01" /></label>
              <label>Notes<textarea name="notes" maxLength={3000} rows={5} /></label>
              <footer><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" disabled={busyId === "referral"}>{busyId === "referral" ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />} Save referral</button></footer>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
