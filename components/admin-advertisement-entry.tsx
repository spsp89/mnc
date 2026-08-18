"use client";

import { CheckCircle2, ImagePlus, LoaderCircle, Megaphone, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { uploadPrivateMedia } from "@/lib/private-media-upload";

type Business = { id: string; name: string; status: string; listingStatus: string };
type Audience = "ALL" | "STATE" | "DISTRICT" | "CITY";
const apiMessage = (body: { message?: string | string[] } | null, fallback: string) => Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? fallback;
const localDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export function AdminAdvertisementEntry() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [creativeKey, setCreativeKey] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetch("/api/admin/advertisements/options", { signal: controller.signal }).then(async (response) => {
      const body = await response.json() as { data?: { businesses?: Business[] }; message?: string | string[] };
      if (!response.ok) throw new Error(apiMessage(body, "Advertisement options could not be loaded."));
      setBusinesses(body.data?.businesses ?? []);
    }).catch((caught) => {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Advertisement options could not be loaded.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);

  const openDialog = () => { setLoading(true); setError(""); setOpen(true); };
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true); setError("");
    try { const result = await uploadPrivateMedia(file, "advertisement_image"); setCreativeKey(result.objectKey); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Creative upload failed."); }
    finally { setUploading(false); }
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/advertisements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        businessId: businessId || undefined, title: form.get("title"), placement: form.get("placement"), audience,
        location: audience === "ALL" ? undefined : form.get("location"), creativeKey: creativeKey || undefined,
        destination: form.get("destination"), budget: Number(form.get("budget")), status: form.get("status"),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(), endsAt: new Date(String(form.get("endsAt"))).toISOString(), reason: form.get("reason"),
      }) });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(apiMessage(body, "Advertisement could not be created."));
      setOpen(false); setNotice("Advertisement entered with zero spend and impressions, plus immutable audit evidence.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Advertisement could not be created."); }
    finally { setSaving(false); }
  };

  const starts = new Date(); starts.setMinutes(starts.getMinutes() + 5);
  const ends = new Date(starts); ends.setDate(ends.getDate() + 30);
  return <>
    {notice && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {notice}</p>}
    <section className="admin-finance-create-bar"><div><strong>Operations-entered advertisements</strong><span>Create a platform or business-sponsored campaign with an audited budget, audience, destination and schedule.</span></div><button type="button" onClick={openDialog}><Megaphone size={17} /> Enter advertisement</button></section>
    {open && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-advertisement-modal" role="dialog" aria-modal="true" aria-labelledby="advertisement-entry-title"><header><div><small>Audited campaign entry</small><h2 id="advertisement-entry-title">Enter advertisement</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close advertisement form"><X size={18} /></button></header><form onSubmit={submit}>
      {loading && <p className="admin-create-note"><LoaderCircle className="spin" size={16} /> Loading campaign options…</p>}
      <div className="admin-manual-payment-grid"><label>Sponsoring business (optional)<select value={businessId} onChange={(event) => setBusinessId(event.target.value)} disabled={loading}><option value="">BNC platform campaign</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name} · {business.status.replaceAll("_", " ")}</option>)}</select></label><label>Initial status<select name="status" defaultValue="DRAFT"><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option></select></label></div>
      <label>Campaign title<input name="title" minLength={3} maxLength={160} required placeholder="Monsoon marketplace campaign" /></label>
      <div className="admin-offer-fields"><label>Placement<select name="placement" defaultValue="HOME_SECONDARY"><option value="HOME_HERO">Home hero</option><option value="HOME_SECONDARY">Home secondary</option><option value="LISTINGS">Listings</option><option value="SEARCH_RESULTS">Search results</option><option value="OFFERS">Offers</option><option value="BUSINESS_DETAIL">Business detail</option></select></label><label>Audience<select value={audience} onChange={(event) => setAudience(event.target.value as Audience)}><option value="ALL">All users</option><option value="STATE">State</option><option value="DISTRICT">District</option><option value="CITY">City</option></select></label><label>{audience === "ALL" ? "Location" : `${audience[0]}${audience.slice(1).toLowerCase()} name`}<input name="location" disabled={audience === "ALL"} required={audience !== "ALL"} maxLength={160} placeholder={audience === "ALL" ? "Not required" : "Target location"} /></label></div>
      <div className="admin-manual-payment-grid"><label>Destination (HTTPS or /path)<input name="destination" maxLength={500} required pattern="(https://[^\\s]+|/[a-zA-Z0-9/_?&=.#%-]*)" placeholder="/offers or https://merchant.example" /></label><label>Campaign budget (₹)<input name="budget" type="number" min="1" max="999999999.99" step="0.01" required /></label></div>
      <div className="admin-manual-payment-grid"><label>Starts at<input name="startsAt" type="datetime-local" defaultValue={localDateTime(starts)} required /></label><label>Ends at<input name="endsAt" type="datetime-local" defaultValue={localDateTime(ends)} required /></label></div>
      <label>Creative image (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0])} disabled={uploading} /><small className="admin-upload-state">{uploading ? <><LoaderCircle className="spin" size={13} /> Securely uploading…</> : creativeKey ? <><ImagePlus size={13} /> Creative ready</> : "A text-only draft can be saved without an image."}</small></label>
      <label>Audit reason<textarea name="reason" minLength={8} maxLength={1000} required placeholder="Why operations is entering this campaign" /></label>
      <p className="admin-safety-note"><ShieldCheck size={15} /> Creation never records spend, impressions or clicks. Scheduled business campaigns require an active business; drafts may be prepared earlier.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" disabled={saving || loading || uploading}>{saving ? <LoaderCircle className="spin" size={15} /> : <Megaphone size={15} />} Save advertisement</button></footer>
    </form></section></div>}
  </>;
}
