"use client";

import { CheckCircle2, LoaderCircle, Mail, MapPin, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { appPath } from "@/lib/client-routing";

export function ContactView({
  initialTopic = "support",
  initialMessage = "",
  eyebrow = "Contact BNC",
  heading = "Tell us what needs attention.",
}: {
  initialTopic?: string;
  initialMessage?: string;
  eyebrow?: string;
  heading?: string;
}) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath("/api/contact"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send the message.");
      setState("success");
      event.currentTarget.reset();
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Unable to send the message.");
    }
  }

  return (
    <AppShell headerVariant="immersive">
      <section className="contact-page">
        <div className="contact-intro">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{heading}</h1>
          <p>Share enough context for the right team to respond, without including passwords, payment credentials or unnecessary identity documents.</p>
          <div>
            <span><Mail size={18} /><div><strong>General support</strong><small>Use the secure form on this page</small></div></span>
            <span><MapPin size={18} /><div><strong>Service region</strong><small>Kerala, India</small></div></span>
          </div>
          <aside><ShieldCheck size={17} /><p>For an ownership or verification request, use the dedicated claim flow so proof stays in private document storage.</p></aside>
        </div>
        {state === "success" ? (
          <div className="contact-success"><CheckCircle2 size={38} /><h2>Your message is with the right queue.</h2><p>Keep this page open only if you want to send another request.</p><button type="button" onClick={() => setState("idle")}>Send another message</button></div>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <div className="form-two-column"><label>Name<input name="name" autoComplete="name" required /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label></div>
            <label>Topic<select name="topic" defaultValue={["support", "business", "plans", "privacy", "press", "other"].includes(initialTopic) ? initialTopic : "support"}><option value="support">Customer support</option><option value="business">Business listing or claim</option><option value="plans">Business plans</option><option value="privacy">Privacy request</option><option value="press">Press and partnerships</option><option value="other">Something else</option></select></label>
            <label>How can we help?<textarea name="message" defaultValue={initialMessage} minLength={15} maxLength={2000} placeholder="Include any relevant business URL or enquiry reference." required /></label>
            {state === "error" && <p className="form-error" role="alert">{message}</p>}
            <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? <LoaderCircle className="spin" size={16} /> : <Mail size={16} />}{state === "submitting" ? "Sending…" : "Send to BNC"}</button>
            <small>Support submissions are used only to resolve the request and protect the service.</small>
          </form>
        )}
      </section>
    </AppShell>
  );
}
