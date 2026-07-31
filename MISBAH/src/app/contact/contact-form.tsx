"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackAnalyticsEvent } from "@/app/_components/analytics";

type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "sending"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const initialStatus: FormStatus = { type: "idle", message: "" };

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [hasStarted, setHasStarted] = useState(false);
  const startedAt = useMemo(() => Date.now().toString(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.reportValidity()) return;

    setStatus({ type: "sending", message: "Sending your enquiry…" });
    trackAnalyticsEvent("generate_lead_attempt", {
      form_name: "strategy_enquiry",
    });

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "Your enquiry could not be sent.");
      }

      form.reset();
      trackAnalyticsEvent("generate_lead", {
        form_name: "strategy_enquiry",
        service: String(payload.service || "unknown"),
        timeline: String(payload.timeline || "unknown"),
      });
      setStatus({
        type: "success",
        message: "Thank you. Your enquiry has been sent successfully.",
      });
    } catch (error) {
      trackAnalyticsEvent("generate_lead_error", {
        form_name: "strategy_enquiry",
      });
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Your enquiry could not be sent.",
      });
    }
  }

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit}
      onChange={() => {
        if (hasStarted) return;
        setHasStarted(true);
        trackAnalyticsEvent("form_start", { form_name: "strategy_enquiry" });
      }}
      noValidate
    >
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="contact-form__row">
        <label>
          Name
          <input name="name" type="text" autoComplete="name" required minLength={2} maxLength={80} />
        </label>
        <label>
          Work email
          <input name="email" type="email" autoComplete="email" required maxLength={120} />
        </label>
      </div>

      <div className="contact-form__row">
        <label>
          Company
          <input name="company" type="text" autoComplete="organization" required minLength={2} maxLength={100} />
        </label>
        <label>
          Service
          <select name="service" defaultValue="" required>
            <option value="" disabled>Select a service</option>
            <option>Brand Strategy &amp; Positioning</option>
            <option>Leadership Brand Advisory</option>
            <option>Visionary Brand Mentorship</option>
            <option>Workshop or Capability Building</option>
            <option>Not sure yet</option>
          </select>
        </label>
      </div>

      <label>
        What challenge are you working through?
        <textarea name="challenge" required minLength={20} maxLength={1500} rows={6} />
      </label>

      <label>
        Preferred timeline
        <select name="timeline" defaultValue="" required>
          <option value="" disabled>Select a timeline</option>
          <option>As soon as possible</option>
          <option>Within 1–3 months</option>
          <option>Within 3–6 months</option>
          <option>Exploring for later</option>
        </select>
      </label>

      <label className="contact-form__consent">
        <input name="consent" type="checkbox" value="yes" required />
        <span>I agree that my information may be used to respond to this enquiry.</span>
      </label>

      <button type="submit" disabled={status.type === "sending"}>
        {status.type === "sending" ? "Sending…" : "Send Strategy Enquiry"}
      </button>

      <div className="contact-form__response" aria-live="polite">
        {status.message && (
          <p data-status={status.type}>
            {status.message}{" "}
            {status.type === "error" && (
              <a href="mailto:hello@misbahsalam.com?subject=Strategy%20Enquiry">
                Email the enquiry instead.
              </a>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
