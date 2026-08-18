"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { appPath } from "@/lib/client-routing";

export function JobApplicationForm({ jobId }: { jobId: string }) {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath(`/api/jobs/${encodeURIComponent(jobId)}/applications`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone") || undefined,
          coverNote: form.get("coverNote") || undefined,
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Application could not be submitted.");
      }
      setSubmitted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Application could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="job-application-success" role="status">
        <CheckCircle2 size={28} />
        <div><strong>Application received</strong><p>The business can now review it in its BNC job console.</p></div>
      </div>
    );
  }

  return (
    <form className="job-application-form" onSubmit={submit}>
      <div>
        <span className="eyebrow">Apply through BNC</span>
        <h2>Send your application</h2>
        <p>Your details go directly to this business&apos;s secured applicant console.</p>
      </div>
      <label>Name<input name="name" minLength={2} maxLength={120} required autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Phone <small>Optional</small><input name="phone" maxLength={20} inputMode="tel" autoComplete="tel" /></label>
      <label>Short note <small>Optional</small><textarea name="coverNote" maxLength={3000} rows={6} placeholder="Share your relevant experience or availability." /></label>
      {message && <p className="form-error" role="alert">{message}</p>}
      <button type="submit" disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
        {busy ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
