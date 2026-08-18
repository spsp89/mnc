"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { appPath } from "@/lib/client-routing";

export function WaitlistForm() {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(appPath("/api/waitlist"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: form.get("phone"), locale: "en" }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to join the waitlist.");
      setState("success");
      event.currentTarget.reset();
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Unable to join the waitlist.");
    }
  }

  if (state === "success") {
    return <p className="waitlist-success" role="status"><CheckCircle2 size={17} /> You’re on the app waitlist.</p>;
  }

  return (
    <>
      <form className="waitlist-form" onSubmit={submit}>
        <label>
          <span className="sr-only">Mobile number</span>
          <input name="phone" type="tel" placeholder="+91 98765 43210" aria-label="Mobile number" pattern="[0-9+\\s-]{10,16}" required />
        </label>
        <button type="submit" disabled={state === "submitting"}>{state === "submitting" && <LoaderCircle className="spin" size={15} />}{state === "submitting" ? "Joining…" : "Join waitlist"}</button>
      </form>
      {state === "error" && <p className="waitlist-error" role="alert">{message}</p>}
    </>
  );
}
