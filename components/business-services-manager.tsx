"use client";

import {
  CheckCircle2,
  Clock3,
  Edit3,
  Home,
  Image as ImageIcon,
  LoaderCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { prepareProductImageVariants, uploadPrivateMedia } from "@/lib/private-media-upload";
import { formatCurrency } from "@/lib/utils";

type ServiceMedia = {
  objectKey: string;
  publicUrl?: string | null;
  altText?: string | null;
  scanStatus?: string;
};

type ManagedService = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  startingPrice: string | number | null;
  pricingType: ServiceForm["pricingType"];
  durationMinutes: number | null;
  homeService: boolean;
  isActive: boolean;
  category?: { id: string; name: string; slug: string };
  media: ServiceMedia[];
};

type Category = {
  id: string;
  name: string;
  children?: Category[];
};

type CategoryOption = Category & { label: string };

type ServiceForm = {
  categoryId: string;
  name: string;
  description: string;
  startingPrice: string;
  pricingType: "FIXED" | "STARTING_AT" | "HOURLY" | "DAILY" | "PER_UNIT" | "QUOTE";
  durationMinutes: string;
  homeService: boolean;
};

const emptyForm: ServiceForm = {
  categoryId: "",
  name: "",
  description: "",
  startingPrice: "",
  pricingType: "STARTING_AT",
  durationMinutes: "",
  homeService: false,
};

function flattenCategories(categories: Category[], parents: string[] = []): CategoryOption[] {
  return categories.flatMap((category) => {
    const path = [...parents, category.name];
    return [
      { ...category, label: path.join(" › ") },
      ...flattenCategories(category.children ?? [], path),
    ];
  });
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
}

function mediaSource(media: ServiceMedia | undefined, businessId: string) {
  if (!media) return "";
  if (media.publicUrl) return media.publicUrl;
  if (media.objectKey) {
    return appPath(`/api/media/object?purpose=service_image&businessId=${encodeURIComponent(businessId)}&objectKey=${encodeURIComponent(media.objectKey)}`);
  }
  return "";
}

export function BusinessServicesManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [services, setServices] = useState<ManagedService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId);
  const canManage = workspace?.capabilities.includes("business:catalog:manage") ?? false;
  const editingService = services.find((service) => service.id === editingId);
  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  const load = useCallback(async () => {
    if (!businessId) {
      setServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const [servicesResponse, categoriesResponse] = await Promise.all([
        fetch(appPath(`/api/business/services?businessId=${encodeURIComponent(businessId)}`)),
        fetch(appPath("/api/business/categories")),
      ]);
      const servicesBody = await servicesResponse.json() as { data?: ManagedService[]; message?: string | string[] };
      const categoriesBody = await categoriesResponse.json() as { data?: Category[]; message?: string | string[] };
      if (!servicesResponse.ok || !categoriesResponse.ok) {
        const errorMessage = servicesBody.message ?? categoriesBody.message;
        throw new Error(Array.isArray(errorMessage) ? errorMessage.join(" ") : errorMessage ?? "Services could not be loaded.");
      }
      setServices(servicesBody.data ?? []);
      setCategories(categoriesBody.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Services could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMediaFiles([]);
    setRemoveExistingMedia(false);
    setFormOpen(true);
    setMessage("");
  }

  function openEdit(service: ManagedService) {
    setEditingId(service.id);
    setForm({
      categoryId: service.categoryId,
      name: service.name,
      description: service.description,
      startingPrice: service.startingPrice == null ? "" : String(service.startingPrice),
      pricingType: service.pricingType,
      durationMinutes: service.durationMinutes == null ? "" : String(service.durationMinutes),
      homeService: service.homeService,
    });
    setMediaFiles([]);
    setRemoveExistingMedia(false);
    setFormOpen(true);
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !canManage) return;
    setBusy(true);
    setMessage("");
    try {
      const uploadedMedia = mediaFiles.length
        ? await Promise.all(mediaFiles.map(async (file, index) => {
            const [gallery] = await prepareProductImageVariants(file);
            const upload = await uploadPrivateMedia(gallery.file, "service_image", workspace.id);
            return {
              objectKey: upload.objectKey,
              mediaType: "image",
              altText: `${form.name} service photo ${index + 1}`,
              sortOrder: index,
            };
          }))
        : removeExistingMedia ? [] : undefined;
      const payload = {
        ...(editingId ? {} : { businessId: workspace.id }),
        categoryId: form.categoryId,
        name: form.name.trim(),
        slug: editingService?.slug ?? slugify(form.name),
        description: form.description.trim(),
        startingPrice: form.startingPrice ? Number(form.startingPrice) : editingId ? null : undefined,
        pricingType: form.pricingType,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : editingId ? null : undefined,
        homeService: form.homeService,
        media: uploadedMedia,
      };
      const response = await fetch(
        appPath(editingId ? `/api/business/services/${editingId}` : "/api/business/services"),
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) {
        throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Service could not be saved.");
      }
      setFormOpen(false);
      setMessage(editingId ? "Service updated on the public catalogue." : "Service added to the public catalogue.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Service could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function updateState(service: ManagedService, action: "toggle" | "archive") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/services/${service.id}`), {
        method: action === "archive" ? "DELETE" : "PATCH",
        headers: action === "toggle" ? { "content-type": "application/json" } : undefined,
        body: action === "toggle" ? JSON.stringify({ isActive: !service.isActive }) : undefined,
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) {
        throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Service could not be updated.");
      }
      setMessage(action === "archive" ? "Service archived." : service.isActive ? "Service paused." : "Service published.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Service could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">What you do</span><h1>Services</h1><p>Publish real service descriptions, pricing, duration, coverage options and photos across the category directory.</p></div>
        <div className="business-product-heading-actions">
          {user.businesses.length > 1 && <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>}
          <button type="button" onClick={openCreate} disabled={!canManage}><Plus size={15} /> Add service</button>
        </div>
      </section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {message}</p>}
      {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading services</strong></div></section> : services.length ? (
        <section className="business-product-list business-service-list">
          {services.map((service) => {
            const imageSource = mediaSource(service.media?.[0], businessId);
            return <article key={service.id}>
              {imageSource ? <Image className="business-product-thumbnail" src={imageSource} alt={service.media[0]?.altText ?? service.name} width={76} height={76} sizes="76px" unoptimized={imageSource.includes("/api/media/object?")} /> : <span className="business-product-thumbnail business-product-thumbnail-empty"><ImageIcon size={22} /></span>}
              <div><span className={`product-workflow-status ${service.isActive ? "status-published" : ""}`}>{service.isActive ? "Published" : "Paused"}</span><h2>{service.name}</h2><p>{service.category?.name ?? "Service category"} · {service.pricingType.replaceAll("_", " ")}</p><small>{service.description}</small><small>{service.homeService && <><Home size={12} /> Home service</>} {service.durationMinutes && <><Clock3 size={12} /> {service.durationMinutes} minutes</>}</small></div>
              <strong>{service.startingPrice == null ? "Request quote" : formatCurrency(Number(service.startingPrice))}</strong>
              {canManage && <div className="business-product-actions"><button type="button" onClick={() => openEdit(service)} disabled={busy}><Edit3 size={14} /> Edit</button><button type="button" onClick={() => void updateState(service, "toggle")} disabled={busy}>{service.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />} {service.isActive ? "Pause" : "Publish"}</button><button type="button" onClick={() => void updateState(service, "archive")} disabled={busy}><Trash2 size={14} /> Archive</button></div>}
            </article>;
          })}
        </section>
      ) : <section className="manager-table-card"><div className="admin-empty"><Wrench size={28} /><strong>Add your first service</strong><span>Services published here appear in BNC discovery and on your business profile.</span>{canManage && <button type="button" onClick={openCreate}><Plus size={15} /> Add service</button>}</div></section>}

      {formOpen && <div className="business-product-dialog-backdrop" role="presentation"><section className="business-product-dialog" role="dialog" aria-modal="true" aria-labelledby="service-form-title"><header><div><span className="eyebrow">Service catalogue</span><h2 id="service-form-title">{editingId ? "Edit service" : "Add a service"}</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close service form"><X size={18} /></button></header><form onSubmit={save}>
        <div className="form-two-column"><label>Service name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={160} required /></label><label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required><option value="">Select category</option>{categoryOptions.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select></label></div>
        <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} minLength={10} maxLength={5000} rows={5} required /></label>
        <div className="form-two-column"><label>Starting price (optional)<input type="number" min="0" step="0.01" value={form.startingPrice} onChange={(event) => setForm({ ...form, startingPrice: event.target.value })} /></label><label>Pricing type<select value={form.pricingType} onChange={(event) => setForm({ ...form, pricingType: event.target.value as ServiceForm["pricingType"] })}><option value="STARTING_AT">Starting at</option><option value="FIXED">Fixed</option><option value="HOURLY">Hourly</option><option value="DAILY">Daily</option><option value="PER_UNIT">Per unit</option><option value="QUOTE">Quote</option></select></label></div>
        <div className="form-two-column"><label>Duration in minutes (optional)<input type="number" min="5" max="525600" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></label><label className="business-offer-checkbox"><input type="checkbox" checked={form.homeService} onChange={(event) => setForm({ ...form, homeService: event.target.checked })} /> Available at customer location</label></div>
        {editingService?.media?.length ? <div className="business-product-current-media"><strong>Current photos</strong><div>{editingService.media.map((item) => { const source = mediaSource(item, businessId); return source ? <Image src={source} alt={item.altText ?? editingService.name} width={92} height={72} unoptimized={source.includes("/api/media/object?")} key={item.objectKey} /> : null; })}</div><label><input type="checkbox" checked={removeExistingMedia} onChange={(event) => setRemoveExistingMedia(event.target.checked)} /> Remove all current photos when saving</label></div> : null}
        <label>Service photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setMediaFiles(Array.from(event.target.files ?? []).slice(0, 6))} /><small>{mediaFiles.length ? `${mediaFiles.length} photo${mediaFiles.length === 1 ? "" : "s"} selected.` : "Up to 6 JPEG, PNG or WebP photos."}</small></label>
        <footer><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />} Save service</button></footer>
      </form></section></div>}
    </DashboardShell>
  );
}
