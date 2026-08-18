"use client";

import { ArrowDown, ArrowUp, CheckCircle2, LoaderCircle, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type Plan = {
  id: string; name: string; slug: string; priority: number; displayOrder: number; starLevel: number;
  listingReach: "NEARBY_5KM" | "CONSTITUENCY" | "DISTRICT" | "STATE";
  offerReach: "NEARBY_5KM" | "DISTRICT" | "STATE";
  monthlyPrice: string | number; annualPrice: string | number; leadQuota: number | null;
  offerLimit: number | null; productLimit: number | null; mediaLimit: number | null;
  categoryLimit: number; locationLimit: number; teamMemberLimit: number;
  descriptionEnabled: boolean; socialLinksEnabled: boolean; bookingEnabled: boolean; deliveryEnabled: boolean;
  automaticLeadAlerts: boolean; sponsoredPlacement: boolean; advancedAnalytics: boolean;
  features: unknown; isActive: boolean; _count?: { subscriptions: number };
};

const emptyPlan: Omit<Plan, "id"> = {
  name: "", slug: "", priority: 1, displayOrder: 1, starLevel: 0, listingReach: "NEARBY_5KM", offerReach: "NEARBY_5KM",
  monthlyPrice: 0, annualPrice: 0, leadQuota: null, offerLimit: 0, productLimit: 0, mediaLimit: 0,
  categoryLimit: 1, locationLimit: 1, teamMemberLimit: 1, descriptionEnabled: true, socialLinksEnabled: true,
  bookingEnabled: false, deliveryEnabled: false, automaticLeadAlerts: false, sponsoredPlacement: false,
  advancedAnalytics: false, features: [], isActive: true,
};

const numericFields = ["priority", "displayOrder", "starLevel", "monthlyPrice", "annualPrice", "leadQuota", "offerLimit", "productLimit", "mediaLimit", "categoryLimit", "locationLimit", "teamMemberLimit"] as const;
const booleanFields = ["descriptionEnabled", "socialLinksEnabled", "bookingEnabled", "deliveryEnabled", "automaticLeadAlerts", "sponsoredPlacement", "advancedAnalytics", "isActive"] as const;

function messageOf(body: { message?: string | string[]; error?: { message?: string | string[] } } | null, fallback: string) {
  const message = body?.message ?? body?.error?.message;
  return Array.isArray(message) ? message.join(" ") : message ?? fallback;
}

export function AdminPlanManager({ user }: { user: BncSessionUser }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/admin/subscription-plans"));
      const body = await response.json() as { data?: Plan[]; message?: string | string[] };
      if (!response.ok) throw new Error(messageOf(body, "Plans could not be loaded."));
      setPlans(body.data ?? []);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Plans could not be loaded."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void Promise.resolve().then(load); }, []);

  async function save(form: HTMLFormElement) {
    setBusy(true); setNotice("");
    try {
      const values = new FormData(form);
      const payload: Record<string, unknown> = { name: values.get("name"), slug: values.get("slug"), listingReach: values.get("listingReach"), offerReach: values.get("offerReach"), reason: values.get("reason") };
      for (const field of numericFields) payload[field] = values.get(field) === "" ? null : Number(values.get(field));
      for (const field of booleanFields) payload[field] = values.get(field) === "on";
      payload.features = String(values.get("features") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
      const response = await fetch(appPath(editing ? `/api/admin/subscription-plans/${editing.id}` : "/api/admin/subscription-plans"), {
        method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[]; error?: { message?: string | string[] } } | null;
      if (!response.ok) throw new Error(messageOf(body, "Plan could not be saved."));
      setNotice(editing ? "Plan updated and audit entry recorded." : "Plan created and audit entry recorded.");
      setEditing(null); setCreating(false); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Plan could not be saved."); }
    finally { setBusy(false); }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...plans]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPlans(next); setBusy(true);
    try {
      const response = await fetch(appPath("/api/admin/subscription-plans/reorder"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: next.map((plan) => plan.id), reason: "Reordered plans from plan management" }) });
      const body = await response.json().catch(() => null) as { message?: string | string[]; error?: { message?: string | string[] } } | null;
      if (!response.ok) throw new Error(messageOf(body, "Plan order could not be saved."));
      setNotice("Plan display order saved."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Plan order could not be saved."); await load(); }
    finally { setBusy(false); }
  }

  const formPlan = editing ?? emptyPlan;
  return <DashboardShell mode="admin" user={user}>
    <section className="manager-heading"><div><span className="eyebrow">Configurable membership</span><h1>Subscription plans</h1><p>Manage prices, entitlements, usage limits and public ordering. Changes are audited server-side.</p></div><button type="button" onClick={() => { setEditing(null); setCreating(true); }}><Plus size={16} /> Create plan</button></section>
    {notice && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {notice}</p>}
    {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading plans</strong></div></section> : plans.length === 0 ? <section className="manager-table-card"><div className="admin-empty"><strong>No plans found</strong><span>Create the first configurable plan.</span></div></section> : <section className="subscription-admin-grid">{plans.map((plan, index) => <article key={plan.id}>
      <header><div><small>Order {index + 1} · {plan.isActive ? "Active" : "Inactive"}</small><h2>{plan.name}</h2></div><div><button aria-label="Move up" disabled={busy || index === 0} onClick={() => void move(index, -1)}><ArrowUp size={15} /></button><button aria-label="Move down" disabled={busy || index === plans.length - 1} onClick={() => void move(index, 1)}><ArrowDown size={15} /></button><button aria-label="Edit plan" onClick={() => { setEditing(plan); setCreating(false); }}><Pencil size={15} /></button></div></header>
      <p><strong>{formatCurrency(Number(plan.monthlyPrice))}</strong>/month · {formatCurrency(Number(plan.annualPrice))}/year</p>
      <dl><div><dt>Offers</dt><dd>{plan.offerLimit ?? "Unlimited"}</dd></div><div><dt>Products</dt><dd>{plan.productLimit ?? "Unlimited"}</dd></div><div><dt>Images</dt><dd>{plan.mediaLimit ?? "Unlimited"}</dd></div><div><dt>Leads</dt><dd>{plan.leadQuota ?? "Unlimited"}</dd></div><div><dt>Locations</dt><dd>{plan.locationLimit}</dd></div><div><dt>Subscribers</dt><dd>{plan._count?.subscriptions ?? 0}</dd></div></dl>
    </article>)}</section>}
    {(creating || editing) && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal subscription-plan-form" role="dialog" aria-modal="true" aria-label="Plan editor"><header><div><small>Audited configuration</small><h2>{editing ? `Edit ${editing.name}` : "Create plan"}</h2></div><button type="button" onClick={() => { setEditing(null); setCreating(false); }}><X size={18} /></button></header><form onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget); }}>
      <div className="subscription-form-grid"><label>Name<input name="name" defaultValue={formPlan.name} minLength={2} maxLength={60} required /></label><label>Slug<input name="slug" defaultValue={formPlan.slug} pattern="[a-z0-9-]+" required /></label>
      {numericFields.map((field) => <label key={field}>{field.replace(/([A-Z])/g, " $1")}<input name={field} type="number" min="0" step={field.includes("Price") ? "0.01" : "1"} defaultValue={formPlan[field] ?? ""} required={["priority", "starLevel", "monthlyPrice", "annualPrice", "categoryLimit", "locationLimit", "teamMemberLimit"].includes(field)} /></label>)}
      <label>Listing reach<select name="listingReach" defaultValue={formPlan.listingReach}>{["NEARBY_5KM", "CONSTITUENCY", "DISTRICT", "STATE"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Offer reach<select name="offerReach" defaultValue={formPlan.offerReach}>{["NEARBY_5KM", "DISTRICT", "STATE"].map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <fieldset><legend>Capabilities</legend>{booleanFields.map((field) => <label key={field}><input name={field} type="checkbox" defaultChecked={formPlan[field]} /> {field.replace(/([A-Z])/g, " $1")}</label>)}</fieldset>
      <label>Feature comparison lines<textarea name="features" rows={7} defaultValue={(Array.isArray(formPlan.features) ? formPlan.features : []).join("\n")} placeholder="One feature per line" /></label><label>Audit reason<textarea name="reason" minLength={5} maxLength={500} required placeholder="Why is this configuration being changed?" /></label>
      <footer><button className="secondary" type="button" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</button><button type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={15} />} Save plan</button></footer>
    </form></section></div>}
  </DashboardShell>;
}
