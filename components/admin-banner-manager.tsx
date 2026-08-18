"use client";

import { CheckCircle2, ImagePlus, LoaderCircle, Pencil, Plus, RefreshCw, ShieldAlert, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { uploadPrivateMedia } from "@/lib/private-media-upload";

type Banner = { id: string; title: string; subtitle: string | null; ctaText: string | null; ctaUrl: string | null; placement: string; imageKey: string; imageUrl: string; startsAt: string | null; endsAt: string | null; displayOrder: number; isActive: boolean };
type UploadState = "idle" | "uploading" | "ready" | "error";

const bannerImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBannerImageBytes = 10_000_000;
const blank = { title: "", subtitle: "", ctaText: "", ctaUrl: "", placement: "HOME_HERO", imageKey: "", startsAt: "", endsAt: "", displayOrder: "0", isActive: false, reason: "" };
const local = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export function AdminBannerManager() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/admin/banners");
      const body = await response.json() as { data?: Banner[]; message?: string };
      if (!response.ok) throw new Error(body.message || "Banners could not be loaded.");
      setRows(body.data ?? []);
      setState("ready");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Banners could not be loaded.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const start = (banner?: Banner) => {
    setEditing(banner ?? null);
    setForm(banner ? {
      title: banner.title, subtitle: banner.subtitle ?? "", ctaText: banner.ctaText ?? "", ctaUrl: banner.ctaUrl ?? "", placement: banner.placement, imageKey: banner.imageKey,
      startsAt: local(banner.startsAt), endsAt: local(banner.endsAt), displayOrder: String(banner.displayOrder), isActive: banner.isActive, reason: "",
    } : blank);
    setUploadState(banner ? "ready" : "idle");
    setUploadError("");
    setSelectedFileName("");
    setOpen(true);
    setNotice("");
  };

  const set = (key: keyof typeof blank, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const upload = async (file?: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setUploadError("");
    set("imageKey", "");
    if (!bannerImageTypes.has(file.type)) {
      setUploadError("Choose a PNG, JPEG, or WebP image.");
      setUploadState("error");
      return;
    }
    if (file.size > maxBannerImageBytes) {
      setUploadError("File exceeds the 10 MB upload limit.");
      setUploadState("error");
      return;
    }
    setUploadState("uploading");
    try {
      const result = await uploadPrivateMedia(file, "banner_image");
      set("imageKey", result.objectKey);
      setUploadState("ready");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
      setUploadState("error");
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, subtitle: form.subtitle || undefined, ctaText: form.ctaText || undefined, ctaUrl: form.ctaUrl || undefined, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined, displayOrder: Number(form.displayOrder) }),
      });
      const body = await response.json() as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message || "Banner could not be saved.");
      setOpen(false);
      setNotice(editing ? "Banner updated and audit recorded." : "Banner created and audit recorded.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Banner could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const uploadMessage = uploadState === "uploading"
    ? <><LoaderCircle className="spin" size={14} /> Uploading and verifying {selectedFileName}…</>
    : uploadState === "ready"
      ? <><CheckCircle2 size={14} /> {selectedFileName ? `Image is ready: ${selectedFileName}` : "Current secure image retained"}</>
      : uploadState === "error"
        ? <><ShieldAlert size={14} /> Upload failed: {uploadError}</>
        : "Choose an image to continue.";
  const displayOrder = Number(form.displayOrder);
  const ctaComplete = Boolean(form.ctaText.trim()) === Boolean(form.ctaUrl.trim());
  const ctaUrlValid = !form.ctaUrl.trim() || /^(https:\/\/[^\s]+|\/[a-zA-Z0-9/_?&=.#%-]*)$/.test(form.ctaUrl.trim());
  const scheduleValid = !form.startsAt || !form.endsAt || new Date(form.endsAt) > new Date(form.startsAt);
  const formValid = form.title.trim().length >= 2
    && uploadState === "ready"
    && Boolean(form.imageKey)
    && form.reason.trim().length >= 8
    && Number.isInteger(displayOrder)
    && displayOrder >= 0
    && displayOrder <= 10000
    && ctaComplete
    && ctaUrlValid
    && scheduleValid;

  return <section className="admin-banner-card">
    <header><div><span className="eyebrow">CMS banners</span><h2>Scheduled page artwork</h2><p>Only active banners inside their configured date window are returned to public clients.</p></div><button className="primary" type="button" onClick={() => start()}><Plus size={16} /> New banner</button></header>
    {notice && <p className={state === "error" ? "form-error" : "settings-saved"} role="status">{notice}</p>}
    {state === "loading" ? <div className="admin-empty"><LoaderCircle className="spin" /><strong>Loading banners</strong></div>
      : state === "error" ? <div className="admin-empty"><RefreshCw /><strong>Banner CMS unavailable</strong><button type="button" onClick={() => void load()}>Try again</button></div>
        : rows.length ? <div className="admin-banner-grid">{rows.map((banner) => <article key={banner.id}><Image unoptimized src={banner.imageUrl} alt="" width={420} height={180} /><div><small>{banner.placement.replaceAll("_", " ")} · order {banner.displayOrder}</small><strong>{banner.title}</strong><span>{banner.isActive ? "Active" : "Inactive"}</span><button type="button" onClick={() => start(banner)}><Pencil size={14} /> Edit</button></div></article>)}</div>
          : <div className="admin-empty"><ImagePlus /><strong>No banners configured</strong><span>Create the first scheduled banner.</span></div>}
    {open && <div className="admin-dialog-backdrop"><form className="admin-record-dialog" onSubmit={save}>
      <header><h2>{editing ? "Edit banner" : "Create banner"}</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close"><X /></button></header>
      <div className="admin-dialog-body admin-create-fields">
        <label><span>Title</span><input required minLength={2} maxLength={120} value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
        <label><span>Subtitle</span><input maxLength={240} value={form.subtitle} onChange={(event) => set("subtitle", event.target.value)} /></label>
        <label><span>Placement</span><select value={form.placement} onChange={(event) => set("placement", event.target.value)}>{["HOME_HERO", "HOME_SECONDARY", "LISTINGS", "OFFERS", "MERCHANT_PORTAL"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>CTA text</span><input maxLength={40} value={form.ctaText} onChange={(event) => set("ctaText", event.target.value)} /></label>
        <label><span>CTA URL (HTTPS or /path)</span><input maxLength={500} value={form.ctaUrl} onChange={(event) => set("ctaUrl", event.target.value)} /></label>
        <label><span>Start</span><input type="datetime-local" value={form.startsAt} onChange={(event) => set("startsAt", event.target.value)} /></label>
        <label><span>End</span><input type="datetime-local" value={form.endsAt} onChange={(event) => set("endsAt", event.target.value)} /></label>
        <label><span>Display order</span><input type="number" min={0} max={10000} value={form.displayOrder} onChange={(event) => set("displayOrder", event.target.value)} /></label>
        <label><span>Image (JPEG, PNG or WebP)</span><input type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="banner-upload-status" onChange={(event) => void upload(event.target.files?.[0])} /><small id="banner-upload-status" className={`banner-upload-status ${uploadState}`} role={uploadState === "error" ? "alert" : "status"}>{uploadMessage}</small></label>
        <label><span><input type="checkbox" checked={form.isActive} onChange={(event) => set("isActive", event.target.checked)} /> Active</span></label>
        <label><span>Audit reason</span><textarea required minLength={8} maxLength={1000} value={form.reason} onChange={(event) => set("reason", event.target.value)} /></label>
      </div>
      <footer><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={saving || !formValid}>{(saving || uploadState === "uploading") && <LoaderCircle className="spin" />}{saving ? "Saving…" : uploadState === "uploading" ? "Uploading image…" : "Save banner"}</button></footer>
    </form></div>}
  </section>;
}
