"use client";

import { CheckCircle2, Gift, LoaderCircle, Play, Plus, Trophy } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Draw = {
  id: string;
  title: string;
  prizeDescription: string;
  kind: "WEEKLY" | "MONTHLY" | "FESTIVAL";
  occasion?: string | null;
  minimumPurchase: number | string;
  weekStartsAt: string;
  weekEndsAt: string;
  status: "DRAFT" | "OPEN" | "DRAWN" | "PUBLISHED" | "CANCELLED";
  winnerOrder?: { orderNumber: string } | null;
  selectionAlgorithm?: string | null;
  candidateHash?: string | null;
  selectionSeed?: string | null;
  selectionHash?: string | null;
  selectionIndex?: number | null;
  candidateCount?: number | null;
  usageEventCount?: number;
};

export function AdminWeeklyDrawManager({ user }: { user: BncSessionUser }) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/admin/weekly-draws"));
      const body = (await response.json()) as { data?: Draw[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Draws could not be loaded.");
      setDraws(body.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Draws could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath("/api/admin/weekly-draws"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          prizeDescription: form.get("prizeDescription"),
          kind: form.get("kind"),
          occasion: form.get("occasion") || undefined,
          minimumPurchase: Number(form.get("minimumPurchase") ?? 200),
          weekStartsAt: new Date(String(form.get("weekStartsAt"))).toISOString(),
          weekEndsAt: new Date(String(form.get("weekEndsAt"))).toISOString(),
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Draw could not be created.");
      event.currentTarget.reset();
      setMessage("Weekly draw draft created.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Draw could not be created.");
    } finally {
      setBusy("");
    }
  }

  async function action(id: string, value: "open" | "select-winner" | "publish") {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/weekly-draws/${id}/${value}`), { method: "POST" });
      const body = (await response.json()) as { data?: { winningOrderNumber?: string; candidateCount?: number; usageEventCount?: number }; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Draw could not be updated.");
      setMessage(body.data?.winningOrderNumber ? `Winner selected from order ${body.data.winningOrderNumber} across ${body.data.candidateCount ?? 0} entries (${body.data.usageEventCount ?? 0} app-usage events). Publish when verified.` : "Draw status updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Draw could not be updated.");
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Purchase rewards</span><h1>Draws &amp; festival bumpers</h1><p>Create weekly, monthly or festival rewards and publish a reproducible cryptographic selection audit.</p></div></section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      <form className="admin-draw-form" onSubmit={create}>
        <label>Draw title<input name="title" minLength={3} maxLength={160} required /></label>
        <label>Prize<input name="prizeDescription" minLength={3} maxLength={500} required /></label>
        <label>Reward type<select name="kind" defaultValue="WEEKLY"><option value="WEEKLY">Weekly gift</option><option value="MONTHLY">Monthly draw</option><option value="FESTIVAL">Festival bumper</option></select></label>
        <label>Festival / occasion<input name="occasion" maxLength={100} placeholder="Onam, Christmas…" /></label>
        <label>Minimum purchase<input name="minimumPurchase" type="number" min={200} step="1" defaultValue={200} required /></label>
        <label>Eligibility starts<input name="weekStartsAt" type="datetime-local" required /></label>
        <label>Eligibility ends<input name="weekEndsAt" type="datetime-local" required /></label>
        <button type="submit" disabled={busy === "create"}>{busy === "create" ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} Create draft</button>
      </form>
      <section className="manager-table-card">
        {loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading draws</strong></div> : draws.length ? <div className="admin-draw-list">{draws.map((draw) => <article key={draw.id}><span><Gift size={18} /></span><div><small>{draw.status} · {new Date(draw.weekStartsAt).toLocaleDateString("en-IN")}–{new Date(draw.weekEndsAt).toLocaleDateString("en-IN")}</small><h2>{draw.title}</h2><p>{draw.prizeDescription}{draw.winnerOrder ? ` · ${draw.winnerOrder.orderNumber}` : ""}</p>{draw.selectionHash && <details className="weekly-audit"><summary>Selection audit · {draw.candidateCount ?? 0} entries</summary><dl><div><dt>Usage events</dt><dd>{draw.usageEventCount ?? 0}</dd></div><div><dt>Winning index</dt><dd>{draw.selectionIndex}</dd></div><div><dt>Candidate hash</dt><dd><code>{draw.candidateHash}</code></dd></div><div><dt>Seed</dt><dd><code>{draw.selectionSeed}</code></dd></div><div><dt>Selection hash</dt><dd><code>{draw.selectionHash}</code></dd></div></dl></details>}</div><div>{draw.status === "DRAFT" && <button type="button" onClick={() => action(draw.id, "open")} disabled={busy === draw.id}><Play size={14} /> Open</button>}{draw.status === "OPEN" && <button type="button" onClick={() => action(draw.id, "select-winner")} disabled={busy === draw.id}><Trophy size={14} /> Select winner</button>}{draw.status === "DRAWN" && <button type="button" onClick={() => action(draw.id, "publish")} disabled={busy === draw.id}><CheckCircle2 size={14} /> Publish result</button>}</div></article>)}</div> : <div className="admin-empty"><Gift size={28} /><strong>No draws created</strong><span>Create the first eligibility window above.</span></div>}
      </section>
    </DashboardShell>
  );
}
