"use client";

import { CheckCircle2, ImagePlus, LoaderCircle, Save, ShieldAlert, Store } from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath, readJsonResponse } from "@/lib/client-routing";
import { prepareProductImageVariants, uploadPrivateMedia } from "@/lib/private-media-upload";

type Location = {
  addressLine1: string; addressLine2: string | null; locality: string; city: string;
  constituency: string | null; district: string; state: string; postalCode: string;
  latitude: string | number; longitude: string | number; serviceRadiusKm: number;
  managedLocationId?: string | null;
  isPrimary?: boolean;
  managedLocation?: { id: string; name: string; type: string; isActive: boolean } | null;
};

type Merchant = {
  id: string; name: string; slug: string; description: string; shortDescription: string | null;
  publicPhone: string | null; contactPhone: string | null; contactWhatsapp: string | null; email: string | null; websiteUrl: string | null; logoUrl: string | null; coverImageUrl: string | null;
  tags: string[]; seoTitle: string | null; seoDescription: string | null;
  media: Array<{ id: string; publicUrl: string; altText: string | null }>;
  status: string; verified: boolean; profileCompleteness: number;
  owner: { legalName: string }; locations: Location[]; categories: Array<{ categoryId: string; isPrimary: boolean; category: { id: string; name: string } }>;
  workingHours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null; closed: boolean }>;
};

const emptyLocation: Location = {
  addressLine1: "", addressLine2: "", locality: "", city: "", constituency: "",
  district: "", state: "", postalCode: "", latitude: "", longitude: "", serviceRadiusKm: 5, managedLocationId: "",
};

function statusLabel(status: string) {
  return status === "ACTIVE" ? "approved" : status === "PENDING_VERIFICATION" || status === "DRAFT" ? "pending" : status.toLowerCase();
}

export function MerchantProfileManager({ user, initialBusinessId }: { user: BncSessionUser; initialBusinessId?: string }) {
  const [businessId, setBusinessId] = useState(initialBusinessId ?? user.businesses[0]?.id ?? "");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", ownerContactName: "", contactPhone: "", contactWhatsapp: "", email: "", websiteUrl: "", description: "", shortDescription: "", tags: "", seoTitle: "", seoDescription: "", categoryId: "", location: emptyLocation,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [managedLocations, setManagedLocations] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [hours, setHours] = useState(Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "09:00", closesAt: "18:00", closed: dayOfWeek === 0 })));
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const workspace = user.businesses.find((item) => item.id === businessId);
  const canManage = workspace?.capabilities.includes("business:profile:manage") ?? false;
  const retainedManagedLocation = merchant?.locations.find((item) => item.managedLocationId === form.location.managedLocationId)?.managedLocation;
  const retainedLocationIsInactive = Boolean(retainedManagedLocation && !managedLocations.some((item) => item.id === retainedManagedLocation.id));

  const load = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true); setNotice(null);
    try {
      const response = await fetch(appPath(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`));
      const body = await readJsonResponse<{ data?: Merchant; message?: string | string[] }>(response, "Merchant profile returned an unreadable response.");
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Merchant profile could not be loaded.");
      const data = body.data;
      const location = data.locations[0] ?? emptyLocation;
      setMerchant(data);
      setHours(Array.from({ length: 7 }, (_, dayOfWeek) => data.workingHours.find((hour) => hour.dayOfWeek === dayOfWeek) ?? { dayOfWeek, opensAt: "09:00", closesAt: "18:00", closed: dayOfWeek === 0 }).map((hour) => ({ ...hour, opensAt: hour.opensAt ?? "09:00", closesAt: hour.closesAt ?? "18:00" })));
      setForm({
        name: data.name, slug: data.slug, ownerContactName: data.owner.legalName, contactPhone: data.contactPhone ?? data.publicPhone ?? "", contactWhatsapp: data.contactWhatsapp ?? "", email: data.email ?? "", websiteUrl: data.websiteUrl ?? "",
        description: data.description, shortDescription: data.shortDescription ?? "", tags: (data.tags ?? []).join(", "), seoTitle: data.seoTitle ?? "", seoDescription: data.seoDescription ?? "", categoryId: data.categories.find((item) => item.isPrimary)?.categoryId ?? data.categories[0]?.categoryId ?? "",
        location: { ...emptyLocation, ...location, latitude: String(location.latitude), longitude: String(location.longitude) },
      });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Merchant profile could not be loaded." });
    } finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { void fetch(appPath("/api/business/categories")).then((response) => response.json() as Promise<{ data?: Array<{ id: string; name: string; children?: Array<{ id: string; name: string }> }> }>).then((body) => setCategoryOptions((body.data ?? []).flatMap((item) => [{ id: item.id, name: item.name }, ...(item.children ?? []).map((child) => ({ id: child.id, name: `${item.name} · ${child.name}` }))]))).catch(() => setCategoryOptions([])); }, []);
  useEffect(() => { void fetch(appPath("/api/locations/tree")).then((response) => response.json() as Promise<{ data?: Array<{ id: string; name: string; type: string }> }>).then((body) => setManagedLocations(body.data ?? [])).catch(() => setManagedLocations([])); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!merchant || !canManage) return;
    setSaving(true); setNotice(null);
    try {
      const response = await fetch(appPath(`/api/business/profile?businessId=${encodeURIComponent(merchant.id)}`), {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), slug: form.slug.trim(), ownerContactName: form.ownerContactName.trim(), contactPhone: form.contactPhone.trim(), contactWhatsapp: form.contactWhatsapp.trim() || null,
          email: form.email.trim() || null, websiteUrl: form.websiteUrl.trim() || null, description: form.description.trim() || undefined, shortDescription: form.shortDescription.trim() || null,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), seoTitle: form.seoTitle.trim() || null, seoDescription: form.seoDescription.trim() || null,
          workingHours: hours.map((hour) => ({ ...hour, opensAt: hour.closed ? null : hour.opensAt, closesAt: hour.closed ? null : hour.closesAt })),
          location: {
            ...form.location,
            managedLocationId: form.location.managedLocationId || null,
            addressLine2: form.location.addressLine2?.trim() || null,
            constituency: form.location.constituency?.trim() || null,
            latitude: Number(form.location.latitude), longitude: Number(form.location.longitude), serviceRadiusKm: Number(form.location.serviceRadiusKm),
          },
        }),
      });
      const body = await readJsonResponse<{ message?: string | string[] }>(response, "Merchant profile returned an unreadable response.");
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Merchant profile could not be saved.");
      if (form.categoryId) {
        const categoryResponse = await fetch(appPath(`/api/business/profile/categories?businessId=${encodeURIComponent(merchant.id)}`), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ categoryIds: [form.categoryId], primaryCategoryId: form.categoryId }) });
        if (!categoryResponse.ok) throw new Error("Business details saved, but the category could not be updated.");
      }
      setNotice({ kind: "success", text: "Merchant profile saved successfully." });
      await load();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Merchant profile could not be saved." });
    } finally { setSaving(false); }
  }

  async function uploadImage(kind: "logo" | "banner" | "gallery", file?: File) {
    if (!merchant || !file || !canManage) return;
    setUploading(true); setNotice(null);
    try {
      const [prepared] = await prepareProductImageVariants(file);
      const uploaded = await uploadPrivateMedia(prepared.file, "business_image", merchant.id);
      const response = await fetch(appPath(`/api/business/profile/media?businessId=${encodeURIComponent(merchant.id)}`), {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, objectKey: uploaded.objectKey, altText: `${merchant.name} ${kind}` }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
        throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Logo could not be saved.");
      }
      setNotice({ kind: "success", text: `${kind === "banner" ? "Cover" : kind} image updated successfully.` });
      await load();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Logo could not be uploaded." });
    } finally { setUploading(false); }
  }

  const locationField = (key: keyof Location, value: string | number) => setForm((current) => ({ ...current, location: { ...current.location, [key]: value } }));

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Merchant account</span><h1>Business profile</h1><p>Keep the owner, contact, business, and primary-location information accurate.</p></div>
        {user.businesses.length > 1 && <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
      </section>
      {merchant && <section className="system-note"><Store size={18} /><div><strong>Account status: {statusLabel(merchant.status)}</strong><p>{merchant.status === "ACTIVE" && merchant.verified ? "This merchant is approved and may submit listings for publication." : "Listings cannot be published until an administrator approves this merchant."}</p></div><span>{merchant.profileCompleteness}% complete</span></section>}
      {notice && <p className={notice.kind === "error" ? "form-error" : "settings-saved"} role={notice.kind === "error" ? "alert" : "status"}>{notice.kind === "error" ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />} {notice.text}</p>}
      {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading merchant profile</strong><span>Retrieving protected business information.</span></div></section> : !merchant ? <section className="manager-table-card"><div className="admin-empty"><Store size={30} /><strong>No merchant profile found</strong><span>Create or claim a business before editing its profile.</span></div></section> : (
        <form className="business-profile-extras-form" onSubmit={save}>
          <section><div className="content-card-heading"><div><span className="eyebrow">Identity</span><h2>Merchant and contact</h2></div></div>
            <div className="form-two-column">
              <label>Managed location<select value={form.location.managedLocationId ?? ""} onChange={(e) => locationField("managedLocationId", e.target.value)}><option value="">Use address only</option>{retainedLocationIsInactive && retainedManagedLocation && <option value={retainedManagedLocation.id} disabled>{retainedManagedLocation.type} · {retainedManagedLocation.name} (inactive — retained)</option>}{managedLocations.map((item) => <option value={item.id} key={item.id}>{item.type} · {item.name}</option>)}</select></label>
              <label>Business name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={160} required /></label>
              <label>Listing slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} required /></label>
              <label>Owner / contact person<input value={form.ownerContactName} onChange={(event) => setForm({ ...form, ownerContactName: event.target.value })} minLength={2} maxLength={160} required /></label>
              <label>Phone<input type="tel" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} pattern="\+?[1-9]\d{9,14}" required /></label>
              <label>WhatsApp<input type="tel" value={form.contactWhatsapp} onChange={(event) => setForm({ ...form, contactWhatsapp: event.target.value })} pattern="\+?[1-9]\d{9,14}" /></label>
              <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={254} /></label>
              <label>Website<input type="url" value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://example.com" /></label>
            </div>
            <div className="form-two-column"><label className="merchant-logo-field"><strong>Profile / logo image</strong>{merchant.logoUrl && <Image src={merchant.logoUrl} alt={`${merchant.name} logo`} width={110} height={110} unoptimized />}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || uploading} onChange={(event) => void uploadImage("logo", event.target.files?.[0])} /><span><ImagePlus size={16} /> {uploading ? "Uploading…" : "Choose logo"}</span></label><label className="merchant-logo-field"><strong>Cover image</strong>{merchant.coverImageUrl && <Image src={merchant.coverImageUrl} alt={`${merchant.name} cover`} width={220} height={110} unoptimized />}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || uploading} onChange={(event) => void uploadImage("banner", event.target.files?.[0])} /><span><ImagePlus size={16} /> Choose cover</span></label></div>
            <label className="merchant-logo-field"><strong>Gallery images</strong><input type="file" accept="image/jpeg,image/png,image/webp" disabled={!canManage || uploading} onChange={(event) => void uploadImage("gallery", event.target.files?.[0])} /><span><ImagePlus size={16} /> Add gallery image</span></label>{merchant.media.length > 0 && <div className="business-profile-gallery-manager">{merchant.media.map((media) => <Image key={media.id} src={media.publicUrl} alt={media.altText ?? merchant.name} width={180} height={120} unoptimized />)}</div>}
          </section>
          <section><div className="content-card-heading"><div><span className="eyebrow">Business information</span><h2>Customer-facing description</h2></div></div>
            <label>Short description<input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} maxLength={240} /></label>
            <label>Business information<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} minLength={30} maxLength={5000} rows={7} /></label>
            <label>Primary category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>{(categoryOptions.length ? categoryOptions : merchant.categories.map((item) => ({ id: item.category.id, name: item.category.name }))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Tags<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="family-friendly, repairs, delivery" /></label>
            <div className="form-two-column"><label>SEO title<input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} maxLength={70} /></label><label>SEO description<input value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} maxLength={160} /></label></div>
          </section>
          <section><div className="content-card-heading"><div><span className="eyebrow">Primary location</span><h2>Address and service area</h2></div></div>
            <div className="form-two-column">
              <label>Address line 1<input value={form.location.addressLine1} onChange={(e) => locationField("addressLine1", e.target.value)} minLength={3} maxLength={180} required /></label>
              <label>Address line 2<input value={form.location.addressLine2 ?? ""} onChange={(e) => locationField("addressLine2", e.target.value)} maxLength={180} /></label>
              <label>Locality<input value={form.location.locality} onChange={(e) => locationField("locality", e.target.value)} required /></label>
              <label>City<input value={form.location.city} onChange={(e) => locationField("city", e.target.value)} required /></label>
              <label>Constituency<input value={form.location.constituency ?? ""} onChange={(e) => locationField("constituency", e.target.value)} /></label>
              <label>District<input value={form.location.district} onChange={(e) => locationField("district", e.target.value)} required /></label>
              <label>State<input value={form.location.state} onChange={(e) => locationField("state", e.target.value)} required /></label>
              <label>Postal code<input inputMode="numeric" pattern="\d{6}" value={form.location.postalCode} onChange={(e) => locationField("postalCode", e.target.value.replace(/\D/g, ""))} maxLength={6} required /></label>
              <label>Latitude<input type="number" step="0.0000001" min="-90" max="90" value={form.location.latitude} onChange={(e) => locationField("latitude", e.target.value)} required /></label>
              <label>Longitude<input type="number" step="0.0000001" min="-180" max="180" value={form.location.longitude} onChange={(e) => locationField("longitude", e.target.value)} required /></label>
            </div>
          </section>
          <section><div className="content-card-heading"><div><span className="eyebrow">Availability</span><h2>Opening hours</h2></div></div><div className="business-workspace-list">{hours.map((hour, index) => <article key={hour.dayOfWeek}><strong>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][hour.dayOfWeek]}</strong><label><input type="checkbox" checked={hour.closed} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, closed: event.target.checked } : item))} /> Closed</label><input type="time" disabled={hour.closed} value={hour.opensAt} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, opensAt: event.target.value } : item))} /><input type="time" disabled={hour.closed} value={hour.closesAt} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, closesAt: event.target.value } : item))} /></article>)}</div></section>
          <button className="manager-save" type="submit" disabled={!canManage || saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} {saving ? "Saving…" : "Save merchant profile"}</button>
        </form>
      )}
    </DashboardShell>
  );
}
