"use client";

import { ArrowRight, BadgeCheck, Building2, CheckCircle2, FileCheck2, LoaderCircle, MapPin, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { appPath } from "@/lib/client-routing";
import { uploadPrivateMedia } from "@/lib/private-media-upload";

type ApiCategory = {
  id: string;
  name: string;
  children?: ApiCategory[];
};

function flattenCategories(categories: ApiCategory[]): ApiCategory[] {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children ?? []),
  ]);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BusinessOnboardingView({
  mode,
  requestedPlan = "bronze",
}: {
  mode: "add" | "claim";
  requestedPlan?: string;
}) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const initialPlan = ["bronze", "silver", "gold", "platinum", "diamond", "ruby"].includes(requestedPlan) ? requestedPlan : "bronze";
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  useEffect(() => {
    if (mode !== "add") return;
    fetch(appPath("/api/business/categories"))
      .then(async (response) => {
        const body = await response.json() as { data?: ApiCategory[] };
        if (response.ok) setCategories(flattenCategories(body.data ?? []));
      })
      .catch(() => setCategories([]));
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("applicationType", mode);
    form.set("consent", String(form.get("consent") === "on"));
    const planSlug = ["bronze", "silver", "gold", "platinum", "diamond", "ruby"].includes(String(form.get("planSlug")))
      ? String(form.get("planSlug"))
      : requestedPlan;
    form.set("requestedPlan", planSlug);
    try {
      const response = mode === "add"
        ? await fetch(appPath("/api/business/workspaces"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: String(form.get("businessName") ?? ""),
              planSlug,
              billingCycle: "monthly",
              slug: `${slugify(String(form.get("businessName") ?? ""))}-${Date.now().toString(36)}`,
              ownerLegalName: String(form.get("ownerName") ?? ""),
              legalName: String(form.get("legalName") ?? "") || undefined,
              description: planSlug === "bronze" ? undefined : String(form.get("description") ?? ""),
              shortDescription: planSlug === "bronze" ? undefined : String(form.get("shortDescription") ?? "") || undefined,
              phone: String(form.get("phone") ?? "").replace(/[^\d+]/g, ""),
              displayPhonePublicly: form.get("displayPhonePublicly") === "on",
              email: String(form.get("email") ?? "") || undefined,
              categoryId: String(form.get("categoryId") ?? ""),
              yearsInBusiness: Number(form.get("yearsInBusiness") || 0),
              location: {
                addressLine1: String(form.get("addressLine1") ?? ""),
                locality: String(form.get("locality") ?? ""),
                city: String(form.get("city") ?? ""),
                constituency: String(form.get("constituency") ?? ""),
                district: String(form.get("district") ?? ""),
                state: "Kerala",
                postalCode: String(form.get("postalCode") ?? ""),
                latitude: Number(form.get("latitude")),
                longitude: Number(form.get("longitude")),
                serviceRadiusKm: 5,
              },
            }),
          })
        : await fetch(appPath("/api/business-applications"), { method: "POST", body: form });
      const result = await response.json() as { error?: string; message?: string | string[] };
      if (!response.ok) {
        const detail = Array.isArray(result.message) ? result.message.join(" ") : result.message;
        throw new Error(detail ?? result.error ?? "Unable to submit the application.");
      }
      const proof = form.get("proof");
      const businessId = mode === "add"
        ? (result as { data?: { id?: string } }).data?.id
        : undefined;
      if (
        mode === "add" &&
        businessId &&
        proof instanceof File &&
        proof.size > 0
      ) {
        const uploaded = await uploadPrivateMedia(
          proof,
          "verification_document",
          businessId,
        );
        const verificationResponse = await fetch(appPath("/api/business/verification"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            businessId,
            documentType: "OTHER",
            documentKey: uploaded.objectKey,
            documentHash: uploaded.sha256,
          }),
        });
        if (!verificationResponse.ok) {
          const verification = await verificationResponse.json() as {
            message?: string | string[];
          };
          throw new Error(
            Array.isArray(verification.message)
              ? verification.message.join(" ")
              : verification.message ?? "The business was created, but its proof could not be attached.",
          );
        }
      }
      setState("success");
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Unable to submit the application.");
    }
  }

  const isClaim = mode === "claim";
  if (state === "success") {
    return (
      <section className="onboarding-success">
        <span><CheckCircle2 size={40} /></span>
        <small className="eyebrow">Application received</small>
        <h1>{isClaim ? "We’ll verify your connection to the business." : "Your local profile is taking shape."}</h1>
        <p>{isClaim ? "A BNC reviewer will check your ownership proof and contact you if anything else is needed." : "Your draft workspace is ready. Add accurate products and services while the public listing is reviewed."}</p>
        <div className="review-timeline"><span className="done"><i>1</i><small>{isClaim ? "Submitted" : "Workspace ready"}</small></span><span><i>2</i><small>Verification</small></span><span><i>3</i><small>Published</small></span></div>
        <Link href="/business/dashboard">Open business dashboard <ArrowRight size={16} /></Link>
      </section>
    );
  }

  return (
    <section className="business-onboarding-page">
      <div className="onboarding-intro">
        <span className="onboarding-icon">{isClaim ? <BadgeCheck size={26} /> : <Store size={26} />}</span>
        <span className="eyebrow">{isClaim ? "Business ownership" : "Join BNC"}</span>
        <h1>{isClaim ? "Claim and manage an existing listing." : "Put your business on the local map."}</h1>
        <p>{isClaim ? "Verify that you represent the business, then update its profile and respond to customers." : "Create a useful profile customers can understand, trust and contact directly."}</p>
        <div className="onboarding-benefits">
          <span><MapPin size={18} /><div><strong>Appear in local search</strong><small>Category, locality and distance-aware discovery</small></div></span>
          <span><Building2 size={18} /><div><strong>Show the complete picture</strong><small>Services, products, hours, offers and proof</small></div></span>
          <span><ShieldCheck size={18} /><div><strong>Responsible customer contact</strong><small>Consent-aware enquiries and auditable access</small></div></span>
        </div>
        <p className="onboarding-switch">{isClaim ? "Can’t find an existing listing?" : "Does your business already appear on BNC?"} <Link href={isClaim ? "/business/add" : "/business/claim"}>{isClaim ? "Add a new business" : "Claim the listing"}</Link></p>
      </div>
      <form className="onboarding-form" onSubmit={submit}>
        <div><span className="eyebrow">{isClaim ? "Ownership request" : "Business application"}</span><h2>Tell us about the business</h2><p>Fields marked required are used for verification and search setup.</p></div>
        <label>Business name<input name="businessName" placeholder="Registered or trading name" required minLength={2} /></label>
        <div className="form-two-column">
          <label>Your full name<input name="ownerName" autoComplete="name" required /></label>
          <label>Mobile number<input name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" pattern="[0-9+\\s-]{10,16}" required /></label>
        </div>
        <label>Primary category<select name={isClaim ? "category" : "categoryId"} required defaultValue=""><option value="" disabled>Select category</option>{(isClaim ? [] : categories).map((category) => <option value={isClaim ? category.name : category.id} key={category.id}>{category.name}</option>)}{isClaim && <><option>Restaurants</option><option>Home services</option><option>Electronics</option><option>Healthcare</option><option>Event services</option></>}</select></label>
        <div className="form-two-column">
          <label>City<select name="city" defaultValue="Kochi"><option>Kochi</option><option>Kozhikode</option><option>Thrissur</option><option>Thiruvananthapuram</option><option>Kannur</option><option>Kottayam</option></select></label>
          <label>Locality<input name="locality" placeholder="Example: Kakkanad" required /></label>
        </div>
        {!isClaim && (
          <>
            <label>Membership plan<select name="planSlug" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)} required><option value="bronze">Bronze · ₹499/month</option><option value="silver">Silver · ₹999/month</option><option value="gold">Gold · ₹2,999/month</option><option value="platinum">Platinum · ₹4,999/month</option><option value="diamond">Diamond · ₹9,999/month</option><option value="ruby">Ruby · ₹14,999/month</option></select></label>
            {selectedPlan === "bronze" ? <p className="onboarding-plan-note">Business descriptions are not included in Bronze. You can add one after upgrading to Silver or above.</p> : <><label>Business description<textarea name="description" minLength={30} maxLength={5000} rows={5} placeholder="Explain what you sell or provide, who you serve and what makes the business useful." required /></label><label>Short summary<input name="shortDescription" maxLength={240} placeholder="A concise public summary" /></label></>}
            <label>Street address<input name="addressLine1" minLength={3} maxLength={180} placeholder="Building, street or landmark" required /></label>
            <div className="form-two-column">
              <label>Assembly constituency<input name="constituency" minLength={2} maxLength={120} required /></label>
              <label>District<input name="district" minLength={2} maxLength={80} required /></label>
            </div>
            <label>PIN code<input name="postalCode" inputMode="numeric" pattern="\d{6}" maxLength={6} required /></label>
            <div className="form-two-column">
              <label>Latitude<input name="latitude" type="number" min="-90" max="90" step="0.000001" placeholder="9.9312" required /></label>
              <label>Longitude<input name="longitude" type="number" min="-180" max="180" step="0.000001" placeholder="76.2673" required /></label>
            </div>
            <div className="form-two-column">
              <label>Business email<input name="email" type="email" autoComplete="email" /></label>
              <label>Years in business<input name="yearsInBusiness" type="number" min="0" max="200" defaultValue="0" /></label>
            </div>
            <label className="consent-check"><input name="displayPhonePublicly" type="checkbox" /><span>Display this business phone number on the public listing after approval.</span></label>
          </>
        )}
        <label className="proof-upload">
          <FileCheck2 size={19} />
          <span><strong>{isClaim ? "Ownership proof" : "Business proof (recommended)"}</strong><small>GST/Udyam certificate, licence or shopfront proof · PDF, JPG or PNG · up to 5 MB</small></span>
          <input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" required={isClaim} />
        </label>
        <label className="consent-check"><input name="consent" type="checkbox" required /><span>I confirm that I am authorised to submit these business details and consent to BNC contacting me for verification.</span></label>
        {state === "error" && <p className="form-error" role="alert">{message}</p>}
        <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}{state === "submitting" ? "Submitting securely…" : isClaim ? "Submit ownership claim" : "Create business application"}</button>
        <small>Applications are reviewed before public verification. Submitted proof is private and access-restricted.</small>
      </form>
    </section>
  );
}
