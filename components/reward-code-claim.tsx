"use client";

import { CheckCircle2, Gift, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { appPath } from "@/lib/client-routing";

export function RewardCodeClaim() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch(appPath("/api/weekly-draws/entries/claim"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: String(data.get("code") ?? "").trim().toUpperCase() }),
      });
      const body = await response.json() as { data?: { draw?: { title?: string } }; message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Reward ID could not be claimed.");
      }
      setSuccess(true);
      setMessage(`Entry claimed for ${body.data?.draw?.title ?? "the reward draw"}.`);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reward ID could not be claimed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="reward-code-claim">
      <div><Gift size={24} /><span><small>Purchased directly from a BNC shop?</small><strong>Claim your merchant-issued reward ID</strong></span></div>
      <form onSubmit={submit}>
        <input name="code" pattern="BNC-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}" placeholder="BNC-AB12-CD34" autoCapitalize="characters" required />
        <button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />} Claim entry</button>
      </form>
      {message && <p className={success ? "success" : "error"} role="status">{message}</p>}
      <small>Sign in is required. Your payment remains between you and the merchant.</small>
    </section>
  );
}
