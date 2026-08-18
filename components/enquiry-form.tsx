"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { appPath } from "@/lib/client-routing";
import type { Business } from "@/lib/types";

export function EnquiryForm({ business }: { business: Business }) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [enquiryId, setEnquiryId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      businessId: business.id,
      categoryId: business.categoryId,
      requirement: String(form.get("requirement") ?? ""),
      locality: business.locality,
      latitude: business.latitude,
      longitude: business.longitude,
      preferredDate: String(form.get("preferredDate") ?? ""),
      customerName: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      contactPreference: String(form.get("contactPreference") ?? "call"),
      consent: form.get("consent") === "on",
    };

    try {
      const response = await fetch(appPath("/api/enquiries"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string; message?: string | string[] };
        throw new Error(Array.isArray(result.message) ? result.message.join(" ") : result.message ?? result.error ?? "Unable to send enquiry.");
      }
      const result = (await response.json()) as { data?: { id?: string }; id?: string };
      setEnquiryId(result.data?.id ?? result.id ?? "");
      setState("success");
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send enquiry.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="enquiry-success" role="status">
        <span><CheckCircle2 size={28} /></span>
        <h3>Your requirement is on its way</h3>
        <p>{business.name} can now respond using the contact preference you selected.</p>
        {enquiryId && <StartConversation enquiryId={enquiryId} />}
        <Link href="/account/messages">Open my BNC messages</Link>
        <button type="button" onClick={() => setState("idle")}>Send another enquiry</button>
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">Free enquiry</span>
          <h3>Ask {business.name}</h3>
        </div>
        <span className="privacy-chip"><LockKeyhole size={13} /> Privacy protected</span>
      </div>
      <label>
        What do you need?
        <select name="requirement" required defaultValue="">
          <option value="" disabled>Select a service</option>
          {business.services.map((service) => <option value={service.name} key={service.id}>{service.name}</option>)}
          <option value="General enquiry">General enquiry</option>
        </select>
      </label>
      <label>
        Preferred date
        <input name="preferredDate" type="date" required />
      </label>
      <div className="form-two-column">
        <label>
          Your name
          <input name="name" autoComplete="name" placeholder="Full name" required />
        </label>
        <label>
          Mobile number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            pattern="[0-9+\s-]{10,16}"
            placeholder="+91 98765 43210"
            required
          />
        </label>
      </div>
      <fieldset>
        <legend>How may the business respond?</legend>
        <label><input type="radio" name="contactPreference" value="call" /> Call</label>
        <label><input type="radio" name="contactPreference" value="in_app" defaultChecked /> BNC in-app chat</label>
      </fieldset>
      <label className="consent-check">
        <input type="checkbox" name="consent" required />
        <span>I consent to BNC sharing these details only with this business for this enquiry.</span>
      </label>
      {state === "error" && <p className="form-error" role="alert">{error}</p>}
      <button className="submit-enquiry" type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />}
        {state === "submitting" ? "Sending…" : "Send enquiry"}
      </button>
      <small>No public phone number. No marketing consent added.</small>
    </form>
  );
}

export function StartConversation({ enquiryId }: { enquiryId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function start() {
    setBusy(true);
    const response = await fetch(appPath("/api/conversations"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enquiryId }),
    });
    const body = (await response.json()) as { data?: { id?: string }; message?: string | string[] };
    if (response.ok) {
      window.location.href = appPath("/account/messages");
      return;
    }
    setMessage(response.status === 401 ? "Sign in to start a BNC chat for this enquiry." : Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Chat could not be started.");
    setBusy(false);
  }
  return <div className="enquiry-chat-start"><button type="button" onClick={start} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />} Start secure BNC chat</button>{message && <p role="alert">{message}</p>}{message.startsWith("Sign in") && <Link href={`/login?returnTo=${encodeURIComponent("/account/messages")}`}>Sign in</Link>}</div>;
}
