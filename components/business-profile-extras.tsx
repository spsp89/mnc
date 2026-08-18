"use client";

import { BadgeIndianRupee, BadgePercent, CheckCircle2, ExternalLink, ImagePlus, LoaderCircle, Plus, Save, Share2, Trash2 } from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { prepareProductImageVariants, uploadPrivateMedia } from "@/lib/private-media-upload";

type ManagedBusiness = {
  id: string;
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  media: Array<{ id: string; publicUrl: string; altText: string | null }>;
  websiteUrl: string | null;
  socialLinks: Record<string, unknown> | null;
  attributes: Record<string, unknown> | null;
  permanentDiscountPercent: number | null;
  permanentDiscountLabel: string | null;
  entitlements: null | {
    plan: { name: string; mediaLimit: number | null; socialLinksEnabled: boolean };
    galleryPhotos: { used: number; limit: number | null };
  };
};

const networks = ["facebook", "instagram", "youtube", "linkedin", "x", "tiktok"] as const;
type Network = (typeof networks)[number];

export function BusinessProfileExtras({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [business, setBusiness] = useState<ManagedBusiness | null>(null);
  const [form, setForm] = useState({
    websiteUrl: "",
    facebook: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    x: "",
    tiktok: "",
    upiId: "",
    paymentAccountName: "",
    permanentDiscountPercent: "",
    permanentDiscountLabel: "",
  });
  const [visibleNetworks, setVisibleNetworks] = useState<Network[]>(["facebook", "instagram"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId);
  const canManage = workspace?.capabilities.includes("business:profile:manage") ?? false;
  const galleryLimit = business?.entitlements?.galleryPhotos.limit;
  const galleryFull = galleryLimit !== null && galleryLimit !== undefined
    && (business?.entitlements?.galleryPhotos.used ?? 0) >= galleryLimit;

  const load = useCallback(async () => {
    if (!businessId) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`));
      const body = (await response.json()) as { data?: ManagedBusiness; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Business profile could not be loaded.");
      const data = body.data;
      const social = data.socialLinks ?? {};
      const attributes = data.attributes ?? {};
      setBusiness(data);
      setForm({
        websiteUrl: data.websiteUrl ?? "",
        facebook: typeof social.facebook === "string" ? social.facebook : "",
        instagram: typeof social.instagram === "string" ? social.instagram : "",
        youtube: typeof social.youtube === "string" ? social.youtube : "",
        linkedin: typeof social.linkedin === "string" ? social.linkedin : "",
        x: typeof social.x === "string" ? social.x : "",
        tiktok: typeof social.tiktok === "string" ? social.tiktok : "",
        upiId: typeof attributes.upiId === "string" ? attributes.upiId : "",
        paymentAccountName: typeof attributes.paymentAccountName === "string" ? attributes.paymentAccountName : "",
        permanentDiscountPercent: data.permanentDiscountPercent === null ? "" : String(data.permanentDiscountPercent),
        permanentDiscountLabel: data.permanentDiscountLabel ?? "",
      });
      const suppliedNetworks = networks.filter((network) => typeof social[network] === "string" && String(social[network]).trim());
      setVisibleNetworks(suppliedNetworks.length ? suppliedNetworks : ["facebook", "instagram"]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Business profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business || !canManage) return;
    setSaving(true);
    setMessage("");
    try {
      const socialLinks = Object.fromEntries(
        networks.map((network) => [network, form[network].trim()]).filter(([, value]) => value),
      );
      const payload = {
        websiteUrl: form.websiteUrl.trim() || null,
        ...(business.entitlements?.plan.socialLinksEnabled ? { socialLinks } : {}),
        upiId: form.upiId.trim() || null,
        paymentAccountName: form.paymentAccountName.trim() || null,
        permanentDiscountPercent: form.permanentDiscountPercent === "" ? 0 : Number(form.permanentDiscountPercent),
        permanentDiscountLabel: form.permanentDiscountLabel.trim() || null,
      };
      const response = await fetch(appPath(`/api/business/profile?businessId=${encodeURIComponent(business.id)}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Business profile could not be saved.");
      setMessage("Business card details saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Business profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(kind: "logo" | "banner" | "gallery", file?: File) {
    if (!business || !file || !canManage) return;
    setUploading(kind);
    setMessage("");
    try {
      const [prepared] = await prepareProductImageVariants(file);
      const uploaded = await uploadPrivateMedia(prepared.file, "business_image", business.id);
      const response = await fetch(appPath(`/api/business/profile/media?businessId=${encodeURIComponent(business.id)}`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, objectKey: uploaded.objectKey, altText: `${business.name} ${kind}` }),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "The image could not be attached.");
      setMessage(`${kind[0].toUpperCase()}${kind.slice(1)} image saved.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploading("");
    }
  }

  async function removeGalleryPhoto(mediaId: string) {
    if (!business || !canManage) return;
    setUploading(mediaId);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/profile/media/${encodeURIComponent(mediaId)}?businessId=${encodeURIComponent(business.id)}`), { method: "DELETE" });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "The gallery photo could not be removed.");
      setMessage("Gallery photo removed.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The gallery photo could not be removed.");
    } finally {
      setUploading("");
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Public business card</span><h1>Social links &amp; permanent discount</h1><p>Keep public contact channels accurate and show customers the standing discount available from this business.</p></div>
        {user.businesses.length > 1 && <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}
      </section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading profile</strong></div></section> : (
        <form className="business-profile-extras-form" onSubmit={save}>
          <section>
            <div className="content-card-heading"><div><span className="eyebrow">Business imagery</span><h2><ImagePlus size={20} /> Logo, banner and gallery</h2></div><span>{business?.entitlements ? `${business.entitlements.galleryPhotos.used} / ${business.entitlements.galleryPhotos.limit ?? "Unlimited"} gallery photos` : "Activate a plan"}</span></div>
            <div className="business-profile-image-tools">
              <label><strong>Profile photo</strong>{business?.logoUrl && <Image src={business.logoUrl} alt={`${business.name} profile`} width={120} height={120} unoptimized />}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || Boolean(uploading)} onChange={(event) => void uploadImage("logo", event.target.files?.[0])} /><span>{uploading === "logo" ? "Uploading…" : "Choose profile photo"}</span></label>
              <label><strong>Banner</strong>{business?.coverImageUrl && <Image src={business.coverImageUrl} alt={`${business.name} banner`} width={240} height={120} unoptimized />}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || Boolean(uploading)} onChange={(event) => void uploadImage("banner", event.target.files?.[0])} /><span>{uploading === "banner" ? "Uploading…" : "Choose banner"}</span></label>
              <label><strong>Gallery</strong><input type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || Boolean(uploading) || !business?.entitlements?.plan.mediaLimit || galleryFull} onChange={(event) => void uploadImage("gallery", event.target.files?.[0])} /><span>{uploading === "gallery" ? "Uploading…" : business?.entitlements?.plan.mediaLimit === 0 ? "Not included in this plan" : galleryFull ? "Gallery limit reached" : "Add gallery photo"}</span></label>
            </div>
            {business?.media.length ? <div className="business-profile-gallery-manager">{business.media.map((media) => <figure key={media.id}><Image src={media.publicUrl} alt={media.altText ?? business.name} width={180} height={120} unoptimized /><button type="button" onClick={() => void removeGalleryPhoto(media.id)} disabled={Boolean(uploading)} aria-label="Remove gallery photo">{uploading === media.id ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}</button></figure>)}</div> : <p>No gallery photos have been added.</p>}
          </section>
          <section>
            <div className="content-card-heading"><div><span className="eyebrow">Online presence</span><h2><Share2 size={20} /> Website and social media</h2></div><ExternalLink size={20} /></div>
            <label>Website URL<input type="url" placeholder="https://yourbusiness.example" value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} /></label>
            {!business?.entitlements?.plan.socialLinksEnabled && <p>Social media links are not included in the {business?.entitlements?.plan.name ?? "current"} plan.</p>}
            <div className="business-social-fields">
              {visibleNetworks.map((network) => <label key={network}>{network === "x" ? "X (Twitter)" : network[0].toUpperCase() + network.slice(1)} URL<input type="url" disabled={!business?.entitlements?.plan.socialLinksEnabled} placeholder={`https://${network}.com/yourbusiness`} value={form[network]} onChange={(event) => setForm({ ...form, [network]: event.target.value })} /></label>)}
            </div>
            {business?.entitlements?.plan.socialLinksEnabled && visibleNetworks.length < networks.length && <button className="business-social-add" type="button" onClick={() => {
              const next = networks.find((network) => !visibleNetworks.includes(network));
              if (next) setVisibleNetworks((current) => [...current, next]);
            }}><Plus size={16} /> Add social or video link</button>}
          </section>
          <section>
            <div className="content-card-heading"><div><span className="eyebrow">Direct customer payment</span><h2><BadgeIndianRupee size={20} /> UPI details</h2></div></div>
            <p>BNC does not collect this payment. Customers pay your business directly from the public profile or BNC chat.</p>
            <div className="form-two-column">
              <label>UPI ID<input inputMode="email" maxLength={120} placeholder="business@bank" value={form.upiId} onChange={(event) => setForm({ ...form, upiId: event.target.value })} /></label>
              <label>Account display name<input maxLength={160} placeholder="Business or account name" value={form.paymentAccountName} onChange={(event) => setForm({ ...form, paymentAccountName: event.target.value })} /></label>
            </div>
          </section>
          <section>
            <div className="content-card-heading"><div><span className="eyebrow">Always-on benefit</span><h2><BadgePercent size={20} /> Permanent customer discount</h2></div></div>
            <p>This appears on your public cards and full business profile. Use 0 to remove the percentage badge.</p>
            <div className="form-two-column">
              <label>Discount percentage<input type="number" min="0" max="100" value={form.permanentDiscountPercent} onChange={(event) => setForm({ ...form, permanentDiscountPercent: event.target.value })} /></label>
              <label>Short label<input maxLength={120} placeholder="For BNC members" value={form.permanentDiscountLabel} onChange={(event) => setForm({ ...form, permanentDiscountLabel: event.target.value })} /></label>
            </div>
          </section>
          <button className="manager-save" type="submit" disabled={!canManage || saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} {saving ? "Saving…" : "Save public card"}</button>
        </form>
      )}
    </DashboardShell>
  );
}
