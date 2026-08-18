"use client";

import {
  Building2,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type ManagedBusiness = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verified: boolean;
  profileCompleteness: number;
  description: string;
  shortDescription: string | null;
  publicPhone: string | null;
  email: string | null;
  websiteUrl: string | null;
  yearsInBusiness: number | null;
  priceRange: number | null;
  attributes: Record<string, unknown> | null;
  locations: Array<{ locality?: string; city?: string; district?: string; state?: string; isPrimary?: boolean }>;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  entitlements: null | {
    plan: { name: string; categoryLimit: number; descriptionEnabled: boolean };
    categories: { used: number; limit: number };
  };
};

type ApiCategory = { id: string; name: string; children?: ApiCategory[] };

function flattenCategories(categories: ApiCategory[]): ApiCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]);
}

type SettingsForm = {
  name: string;
  shortDescription: string;
  description: string;
  publicPhone: string;
  email: string;
  websiteUrl: string;
  yearsInBusiness: string;
  priceRange: string;
  acceptNewEnquiries: boolean;
};

const emptyForm: SettingsForm = {
  name: "",
  shortDescription: "",
  description: "",
  publicPhone: "",
  email: "",
  websiteUrl: "",
  yearsInBusiness: "",
  priceRange: "",
  acceptNewEnquiries: true,
};

export function BusinessSettingsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [business, setBusiness] = useState<ManagedBusiness | null>(null);
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<ApiCategory[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId);
  const canManage = workspace?.capabilities.includes("business:profile:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const [response, categoriesResponse] = await Promise.all([
        fetch(appPath(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`)),
        fetch(appPath("/api/business/categories")),
      ]);
      const body = await response.json() as { data?: ManagedBusiness; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Business settings could not be loaded.");
      const data = body.data;
      const categoryBody = await categoriesResponse.json().catch(() => null) as { data?: ApiCategory[] } | null;
      setBusiness(data);
      setAvailableCategories(flattenCategories(categoryBody?.data ?? []));
      setCategoryIds(data.categories.map((item) => item.category.id));
      setPrimaryCategoryId(data.categories[0]?.category.id ?? "");
      setForm({
        name: data.name,
        shortDescription: data.shortDescription ?? "",
        description: data.description,
        publicPhone: data.publicPhone ?? "",
        email: data.email ?? "",
        websiteUrl: data.websiteUrl ?? "",
        yearsInBusiness: data.yearsInBusiness == null ? "" : String(data.yearsInBusiness),
        priceRange: data.priceRange == null ? "" : String(data.priceRange),
        acceptNewEnquiries: data.attributes?.acceptNewEnquiries !== false,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Business settings could not be loaded.");
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
      const payload = {
        name: form.name.trim(),
        ...(business.entitlements?.plan.descriptionEnabled ? {
          shortDescription: form.shortDescription.trim() || null,
          description: form.description.trim(),
        } : {}),
        publicPhone: form.publicPhone.trim() || null,
        email: form.email.trim() || null,
        websiteUrl: form.websiteUrl.trim() || null,
        yearsInBusiness: form.yearsInBusiness ? Number(form.yearsInBusiness) : null,
        priceRange: form.priceRange ? Number(form.priceRange) : null,
        acceptNewEnquiries: form.acceptNewEnquiries,
      };
      const response = await fetch(appPath(`/api/business/profile?businessId=${encodeURIComponent(business.id)}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Business settings could not be saved.");
      setMessage("Business profile and enquiry settings saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Business settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategories() {
    if (!business || !canManage || !categoryIds.length) return;
    setSavingCategories(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/profile/categories?businessId=${encodeURIComponent(business.id)}`), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryIds, primaryCategoryId: primaryCategoryId || categoryIds[0] }),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Business categories could not be saved.");
      setMessage("Business categories saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Business categories could not be saved.");
    } finally {
      setSavingCategories(false);
    }
  }

  const primaryLocation = business?.locations.find((location) => location.isPrimary) ?? business?.locations[0];

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Workspace controls</span><h1>Business settings</h1><p>Maintain the live public identity, customer contact details and enquiry availability for the selected business.</p></div>{user.businesses.length > 1 && <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} aria-label="Business workspace">{user.businesses.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}</section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {message}</p>}
      {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading settings</strong></div></section> : business && <div className="business-settings-layout">
        <div className="business-settings-form-stack"><form className="manager-table-card business-settings-form" onSubmit={save}><header><div><span className="eyebrow">Public identity</span><h2>Profile details</h2></div><Building2 size={21} /></header><label>Business name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={160} required /></label>{!business.entitlements?.plan.descriptionEnabled && <p>Descriptions are not displayed or editable on the {business.entitlements?.plan.name ?? "current"} plan.</p>}<label>Short description<textarea disabled={!business.entitlements?.plan.descriptionEnabled} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} maxLength={240} rows={3} /></label><label>Full description<textarea disabled={!business.entitlements?.plan.descriptionEnabled} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} minLength={30} maxLength={5000} rows={7} required={business.entitlements?.plan.descriptionEnabled === true} /></label><div className="form-two-column"><label>Public phone<input value={form.publicPhone} onChange={(event) => setForm({ ...form, publicPhone: event.target.value })} maxLength={16} inputMode="tel" /></label><label>Public email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" /></label></div><label>Website URL<input value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} type="url" placeholder="https://" /></label><div className="form-two-column"><label>Years in business<input type="number" min="0" max="200" value={form.yearsInBusiness} onChange={(event) => setForm({ ...form, yearsInBusiness: event.target.value })} /></label><label>Price range<select value={form.priceRange} onChange={(event) => setForm({ ...form, priceRange: event.target.value })}><option value="">Not specified</option><option value="1">₹ · Budget</option><option value="2">₹₹ · Moderate</option><option value="3">₹₹₹ · Premium</option><option value="4">₹₹₹₹ · Luxury</option></select></label></div><label className="business-settings-toggle"><input type="checkbox" checked={form.acceptNewEnquiries} onChange={(event) => setForm({ ...form, acceptNewEnquiries: event.target.checked })} /><span><strong>Accept new enquiries</strong><small>Turn this off when the team cannot take new customer requests.</small></span></label><button className="manager-save" type="submit" disabled={!canManage || saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save settings</button></form><section className="manager-table-card business-category-settings"><header><div><span className="eyebrow">Catalogue scope</span><h2>Business categories</h2></div><Tags size={21} /></header><p>Select up to {business.entitlements?.plan.categoryLimit ?? 1} categories included in the {business.entitlements?.plan.name ?? "active"} plan.</p><div>{availableCategories.map((category) => { const selected = categoryIds.includes(category.id); const full = categoryIds.length >= (business.entitlements?.plan.categoryLimit ?? 1); return <label key={category.id}><input type="checkbox" checked={selected} disabled={!selected && full} onChange={(event) => { const next = event.target.checked ? [...categoryIds, category.id] : categoryIds.filter((id) => id !== category.id); setCategoryIds(next); if (!next.includes(primaryCategoryId)) setPrimaryCategoryId(next[0] ?? ""); }} /><span>{category.name}</span>{selected && <input type="radio" name="primaryCategory" checked={primaryCategoryId === category.id} onChange={() => setPrimaryCategoryId(category.id)} aria-label={`Make ${category.name} primary`} />}</label>; })}</div><button className="manager-save" type="button" onClick={() => void saveCategories()} disabled={!canManage || savingCategories || !categoryIds.length}>{savingCategories ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save categories</button></section></div>
        <aside className="business-settings-sidebar"><section><header><span><ShieldCheck size={19} /></span><div><small>Workspace state</small><h2>{business.status.replaceAll("_", " ")}</h2></div></header><dl><div><dt>Profile completeness</dt><dd>{business.profileCompleteness}%</dd></div><div><dt>Verification</dt><dd>{business.verified ? "Verified" : "Not verified"}</dd></div><div><dt>Categories</dt><dd>{business.categories.length}</dd></div><div><dt>Locations</dt><dd>{business.locations.length}</dd></div></dl><i><b style={{ width: `${business.profileCompleteness}%` }} /></i></section><section><header><span><MapPin size={19} /></span><div><small>Primary location</small><h2>{primaryLocation?.locality ?? primaryLocation?.city ?? "Not set"}</h2></div></header><p>{[primaryLocation?.city, primaryLocation?.district, primaryLocation?.state].filter(Boolean).join(", ") || "Complete the business location during verification."}</p><div className="business-settings-tags">{business.categories.map(({ category }) => <span key={category.id}>{category.name}</span>)}</div></section><section className="business-settings-links"><Link href={`/business/${business.slug}`}><ExternalLink size={15} /> View public profile</Link><Link href="/business/profile/edit"><SlidersHorizontal size={15} /> Social, UPI and discounts</Link></section></aside>
      </div>}
    </DashboardShell>
  );
}
