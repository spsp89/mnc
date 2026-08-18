"use client";

import { CheckCircle2, Gauge, Save, SlidersHorizontal } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { appPath } from "@/lib/client-routing";

type RankingConfiguration = {
  id?: string;
  name?: string;
  version?: number;
  weights?: Record<string, number>;
  active?: boolean;
  reason?: string;
  activatedAt?: string | null;
  createdAt?: string;
};

const fallbackWeights: Record<string, number> = {
  relevance: 35,
  distance: 20,
  rating: 20,
  completeness: 10,
  responseRate: 10,
  sponsored: 5,
};

function asConfiguration(payload: unknown): RankingConfiguration {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? payload as RankingConfiguration : {};
}

function toPercentages(weights?: Record<string, number>) {
  if (!weights || !Object.keys(weights).length) return fallbackWeights;
  const values = Object.values(weights);
  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  const multiplier = total <= 1.001 ? 100 : 1;
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Number((Number(value) * multiplier).toFixed(2))]));
}

function label(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase();
}

export function AdminRankingManager({ payload }: { payload: unknown }) {
  const initial = useMemo(() => asConfiguration(payload), [payload]);
  const [active, setActive] = useState(initial);
  const [weights, setWeights] = useState<Record<string, number>>(() => toPercentages(initial.weights));
  const [name, setName] = useState(() => `${initial.name || "Marketplace ranking"} next`);
  const [reason, setReason] = useState("");
  const [activate, setActivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const total = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0);
  const validTotal = Math.abs(total - 100) < 0.001;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validTotal) {
      setMessage("Ranking weights must total exactly 100%.");
      return;
    }
    if (activate && !window.confirm("Activate this ranking configuration for the marketplace?")) return;
    setBusy(true);
    setMessage("");
    try {
      const normalized = Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Number((value / 100).toFixed(4))]));
      const response = await fetch(appPath("/api/admin/ranking"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), weights: normalized, reason: reason.trim(), activate }),
      });
      const body = (await response.json()) as { data?: RankingConfiguration; message?: string | string[] };
      if (!response.ok || !body.data) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Ranking configuration could not be saved.");
      }
      setActive(body.data);
      setWeights(toPercentages(body.data.weights));
      setReason("");
      setName(`${body.data.name || "Marketplace ranking"} next`);
      setMessage(activate ? "The new ranking configuration is active." : "A new ranking draft was recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ranking configuration could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-ranking-layout">
      <aside className="admin-ranking-current">
        <span><Gauge size={23} /></span>
        <div><small>Active configuration</small><h2>{active.name || "No active configuration"}</h2><p>{active.reason || "Create and activate an audited configuration."}</p></div>
        <dl><div><dt>Version</dt><dd>{active.version ?? "—"}</dd></div><div><dt>Activated</dt><dd>{active.activatedAt ? new Date(active.activatedAt).toLocaleString("en-IN") : "Not active"}</dd></div></dl>
      </aside>
      <form className="admin-ranking-form" onSubmit={submit}>
        <header><SlidersHorizontal size={21} /><div><h2>Create the next configuration</h2><p>Weights are stored as normalized values and every change is written to the audit log.</p></div></header>
        {message && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {message}</p>}
        <div className="admin-form-grid">
          <label>Configuration name<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={80} required /></label>
          <label>Change reason<input value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Why this ranking needs to change" required /></label>
        </div>
        <div className="admin-weight-grid">
          {Object.entries(weights).map(([key, value]) => (
            <label key={key}>
              <span>{label(key)} <strong>{value}%</strong></span>
              <input type="range" min="0" max="100" step="1" value={value} onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))} />
              <input className="admin-weight-number" type="number" min="0" max="100" step="0.1" value={value} onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))} aria-label={`${label(key)} percentage`} />
            </label>
          ))}
        </div>
        <footer>
          <div className={validTotal ? "admin-weight-total valid" : "admin-weight-total"}><span>Total weight</span><strong>{total.toFixed(1)}%</strong></div>
          <label className="admin-checkbox"><input type="checkbox" checked={activate} onChange={(event) => setActivate(event.target.checked)} /> Activate immediately</label>
          <button className="admin-primary-button" type="submit" disabled={busy || !validTotal}><Save size={16} /> {busy ? "Saving…" : "Save configuration"}</button>
        </footer>
      </form>
    </section>
  );
}
