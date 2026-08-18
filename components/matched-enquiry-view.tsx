"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { businesses, categories } from "@/lib/catalog-data";
import { appPath } from "@/lib/client-routing";

type EnquiryDraft = {
  category: string;
  requirement: string;
  location: string;
  preferredDate: string;
  name: string;
  phone: string;
  contactPreference: "call" | "in_app";
  consent: boolean;
};

const initialDraft: EnquiryDraft = {
  category: "",
  requirement: "",
  location: "Kochi",
  preferredDate: "",
  name: "",
  phone: "",
  contactPreference: "in_app",
  consent: false,
};

export function MatchedEnquiryView() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initialDraft);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const matches = useMemo(() => businesses.filter((business) =>
    (!draft.category || business.categorySlug === draft.category)
    && (!draft.location || business.city.toLowerCase() === draft.location.toLowerCase()),
  ).slice(0, 3), [draft.category, draft.location]);

  const update = <K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");
    const primaryMatch = matches[0];
    try {
      const response = await fetch(appPath("/api/enquiries"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: primaryMatch?.id ?? "bnc-matched-request",
          businessName: primaryMatch?.name ?? "BNC matched businesses",
          requirement: `${draft.requirement} · Service area: ${draft.location}`,
          preferredDate: draft.preferredDate,
          name: draft.name,
          phone: draft.phone,
          contactPreference: draft.contactPreference,
          consent: draft.consent,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to submit the enquiry.");
      setState("success");
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Unable to submit the enquiry.");
    }
  }

  if (state === "success") {
    return (
      <section className="matched-enquiry-success">
        <span><CheckCircle2 size={42} /></span>
        <small className="eyebrow">Enquiry submitted</small>
        <h1>We’re finding the right local response.</h1>
        <p>Your requirement has been shared according to your consent choice. You can review progress from your account.</p>
        <div><strong>{Math.max(matches.length, 1)}</strong><span>relevant {matches.length === 1 ? "business" : "businesses"} identified near {draft.location}</span></div>
        <Link href="/account/enquiries">Track my enquiry <ArrowRight size={16} /></Link>
        <button type="button" onClick={() => { setDraft(initialDraft); setStep(1); setState("idle"); }}>Start another request</button>
      </section>
    );
  }

  return (
    <section className="matched-enquiry-page">
      <div className="matched-enquiry-intro">
        <span className="eyebrow">One clear request</span>
        <h1>Tell us what you need.</h1>
        <p>BNC checks service fit, location and availability before sharing your enquiry with relevant local businesses.</p>
        <div className="matched-enquiry-trust">
          <span><ShieldCheck size={18} /><div><strong>Relevant matches only</strong><small>No public posting of your phone number</small></div></span>
          <span><LockKeyhole size={18} /><div><strong>Explicit consent</strong><small>You choose how businesses may respond</small></div></span>
          <span><MessageCircle size={18} /><div><strong>Trackable replies</strong><small>Keep every response with the original need</small></div></span>
        </div>
      </div>
      <form className="matched-enquiry-card" onSubmit={submit}>
        <div className="enquiry-progress" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((item) => <span className={item <= step ? "active" : ""} key={item}><i>{item}</i><small>{item === 1 ? "Need" : item === 2 ? "Timing" : "Contact"}</small></span>)}
        </div>
        {step === 1 && (
          <div className="enquiry-step">
            <span className="eyebrow">Step 1</span><h2>What do you need help with?</h2>
            <label>Category<select value={draft.category} onChange={(event) => update("category", event.target.value)} required><option value="">Choose a category</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label>
            <label>Describe the requirement<textarea value={draft.requirement} onChange={(event) => update("requirement", event.target.value)} minLength={10} maxLength={420} placeholder="Example: My laptop does not charge and I need a diagnosis this week." required /></label>
            <button type="button" disabled={!draft.category || draft.requirement.length < 10} onClick={() => setStep(2)}>Continue <ArrowRight size={16} /></button>
          </div>
        )}
        {step === 2 && (
          <div className="enquiry-step">
            <span className="eyebrow">Step 2</span><h2>Where and when?</h2>
            <label>City or service area<select value={draft.location} onChange={(event) => update("location", event.target.value)}><option>Kochi</option><option>Kozhikode</option><option>Thrissur</option><option>Thiruvananthapuram</option></select></label>
            <label>Preferred date<input type="date" value={draft.preferredDate} onChange={(event) => update("preferredDate", event.target.value)} required /></label>
            <div className="match-preview"><MapPin size={17} /><div><strong>{matches.length} possible matches</strong><small>Based on currently published backend records near {draft.location}</small></div></div>
            <div className="step-actions"><button type="button" className="back" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button><button type="button" disabled={!draft.preferredDate} onClick={() => setStep(3)}>Continue <ArrowRight size={16} /></button></div>
          </div>
        )}
        {step === 3 && (
          <div className="enquiry-step">
            <span className="eyebrow">Step 3</span><h2>How should businesses respond?</h2>
            <div className="form-two-column">
              <label>Your name<input value={draft.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" required /></label>
              <label>Mobile number<input value={draft.phone} onChange={(event) => update("phone", event.target.value)} type="tel" autoComplete="tel" placeholder="+91 98765 43210" pattern="[0-9+\\s-]{10,16}" required /></label>
            </div>
            <fieldset><legend>Contact preference</legend>{(["in_app", "call"] as const).map((preference) => <label key={preference}><input type="radio" checked={draft.contactPreference === preference} onChange={() => update("contactPreference", preference)} /> {preference === "in_app" ? "BNC in-app chat" : "Phone call"}</label>)}</fieldset>
            <label className="consent-check"><input type="checkbox" checked={draft.consent} onChange={(event) => update("consent", event.target.checked)} required /><span>I consent to BNC sharing these details with relevant matched businesses solely for this enquiry.</span></label>
            {state === "error" && <p className="form-error" role="alert">{error}</p>}
            <div className="step-actions"><button type="button" className="back" onClick={() => setStep(2)}><ArrowLeft size={15} /> Back</button><button type="submit" disabled={state === "submitting" || !draft.consent}>{state === "submitting" ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={15} />}{state === "submitting" ? "Submitting…" : "Submit securely"}</button></div>
          </div>
        )}
        <small className="matched-form-note">BNC does not sell contact details or add marketing consent.</small>
      </form>
    </section>
  );
}
