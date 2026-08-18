"use client";

import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  Tag,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type CatalogItem = {
  id: string;
  name: string;
  status?: string;
  stockStatus?: string;
  isActive?: boolean;
};

type Offer = {
  id: string;
  title: string;
  description: string;
  type: OfferForm["type"];
  discountValue: string | number | null;
  couponCode: string | null;
  minimumSpend: string | number | null;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number | null;
  redemptionCount: number;
  isFeatured: boolean;
  featuredRequested: boolean;
  isActive: boolean;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  moderationReason: string | null;
  targetedCount: number;
  products: Array<{ product: CatalogItem }>;
  services: Array<{ service: CatalogItem }>;
};

type OfferForm = {
  title: string;
  description: string;
  type: "PERCENTAGE" | "FLAT" | "FESTIVAL" | "LIMITED_TIME" | "COUPON" | "COMBO" | "NEW_CUSTOMER";
  discountValue: string;
  couponCode: string;
  minimumSpend: string;
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
  isFeatured: boolean;
  productIds: string[];
  serviceIds: string[];
};

function localDateTime(value: Date | string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function freshForm(): OfferForm {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    title: "",
    description: "",
    type: "PERCENTAGE",
    discountValue: "",
    couponCode: "",
    minimumSpend: "",
    startsAt: localDateTime(start),
    endsAt: localDateTime(end),
    maxRedemptions: "",
    isFeatured: false,
    productIds: [],
    serviceIds: [],
  };
}

function offerState(offer: Offer) {
  if (offer.moderationStatus !== "APPROVED") return offer.moderationStatus === "PENDING" ? "Pending review" : "Rejected";
  if (!offer.isActive) return "Paused";
  const now = Date.now();
  if (new Date(offer.startsAt).getTime() > now) return "Scheduled";
  if (new Date(offer.endsAt).getTime() < now) return "Expired";
  return "Live";
}

function offerValue(offer: Offer) {
  const value = Number(offer.discountValue ?? 0);
  if (!value) return offer.type.replaceAll("_", " ");
  return offer.type === "PERCENTAGE" ? `${value}% off` : `${formatCurrency(value)} off`;
}

export function BusinessOffersManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<OfferForm>(freshForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((business) => business.id === businessId);
  const canManage = workspace?.capabilities.includes("business:catalog:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId) {
      setOffers([]);
      setProducts([]);
      setServices([]);
      setState("ready");
      return;
    }
    setState("loading");
    try {
      const response = await fetch(
        appPath(`/api/business/offers?businessId=${encodeURIComponent(businessId)}`),
      );
      const body = await response.json() as {
        data?: Offer[];
        catalog?: { products?: CatalogItem[]; services?: CatalogItem[] };
        message?: string | string[];
      };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Offers could not be loaded.");
      }
      setOffers(body.data ?? []);
      setProducts(body.catalog?.products ?? []);
      setServices(body.catalog?.services ?? []);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Offers could not be loaded.");
      setState("error");
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(freshForm());
    setFormOpen(true);
    setMessage("");
  }

  function openEdit(offer: Offer) {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discountValue: offer.discountValue == null ? "" : String(offer.discountValue),
      couponCode: offer.couponCode ?? "",
      minimumSpend: offer.minimumSpend == null ? "" : String(offer.minimumSpend),
      startsAt: localDateTime(offer.startsAt),
      endsAt: localDateTime(offer.endsAt),
      maxRedemptions: offer.maxRedemptions == null ? "" : String(offer.maxRedemptions),
      isFeatured: offer.featuredRequested,
      productIds: offer.products.map(({ product }) => product.id),
      serviceIds: offer.services.map(({ service }) => service.id),
    });
    setFormOpen(true);
    setMessage("");
  }

  function toggleSelection(field: "productIds" | "serviceIds", id: string) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((item) => item !== id)
        : [...current[field], id],
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !canManage) return;
    setBusy(true);
    setMessage("");
    try {
      const optionalNumber = (value: string) => value ? Number(value) : editingId ? null : undefined;
      const payload = {
        ...(editingId ? {} : { businessId: workspace.id }),
        title: form.title,
        description: form.description,
        type: form.type,
        discountValue: optionalNumber(form.discountValue),
        couponCode: form.couponCode.trim() || (editingId ? null : undefined),
        minimumSpend: optionalNumber(form.minimumSpend),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        maxRedemptions: optionalNumber(form.maxRedemptions),
        isFeatured: form.isFeatured,
        productIds: form.productIds,
        serviceIds: form.serviceIds,
      };
      const response = await fetch(
        appPath(editingId ? `/api/business/offers/${editingId}` : "/api/business/offers"),
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json() as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Offer could not be saved.");
      }
      setFormOpen(false);
      setMessage(editingId ? "Offer updated across the selected items." : "Offer created and connected to the selected items.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Offer could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    if (offer.isActive && !window.confirm("Pause this offer? It will no longer appear to customers.")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/offers/${offer.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      const body = await response.json() as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Offer could not be updated.");
      }
      setMessage(offer.isActive ? "Offer paused." : "Offer activated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Offer could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">Products, services and promotions</span>
          <h1>Offers</h1>
          <p>Create one promotion and apply it to one or many catalogue items.</p>
        </div>
        <div className="business-product-heading-actions">
          {user.businesses.length > 1 && (
            <label>
              <span>Business</span>
              <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
                {user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}
              </select>
            </label>
          )}
          <button type="button" onClick={openCreate} disabled={!canManage}><Plus size={15} /> Create offer</button>
        </div>
      </section>

      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      {!canManage && <section className="manager-api-state"><Tag /><h2>View-only workspace</h2><p>Ask a business administrator for catalogue access.</p></section>}
      {state === "loading" && <section className="manager-api-state"><LoaderCircle className="spin" /><p>Loading business offers…</p></section>}
      {state === "error" && <section className="manager-api-state"><Tag /><h2>Offers are unavailable</h2><p>Try again in a moment.</p></section>}
      {state === "ready" && offers.length === 0 && (
        <section className="manager-api-state"><BadgePercent /><h2>Create your first offer</h2><p>Choose a promotion, schedule and the products or services it applies to.</p>{canManage && <button type="button" onClick={openCreate}><Plus size={15} /> Create offer</button>}</section>
      )}
      {state === "ready" && offers.length > 0 && (
        <section className="business-offer-list">
          {offers.map((offer) => {
            const linkedItems = [
              ...offer.products.map(({ product }) => product.name),
              ...offer.services.map(({ service }) => service.name),
            ];
            return (
              <article key={offer.id}>
                <div className="business-offer-value"><BadgePercent size={19} /><strong>{offerValue(offer)}</strong><span>{offerState(offer)}</span></div>
                <div>
                  <span className="product-workflow-status">{offer.type.replaceAll("_", " ")}</span>
                  <h2>{offer.title}</h2>
                  <p>{offer.description}</p>
                  {offer.moderationReason && <small>Moderation note: {offer.moderationReason}</small>}
                  <small><CalendarDays size={13} /> {new Date(offer.startsAt).toLocaleString("en-IN")} – {new Date(offer.endsAt).toLocaleString("en-IN")}</small>
                  <div className="business-offer-items">
                    {linkedItems.length ? linkedItems.map((item) => <span key={item}>{item}</span>) : <span>Entire business offer</span>}
                  </div>
                </div>
                {canManage && (
                  <div className="business-offer-actions">
                    <button type="button" onClick={() => openEdit(offer)} disabled={busy}><Edit3 size={14} /> Edit</button>
                    <button type="button" onClick={() => void toggleOffer(offer)} disabled={busy}>
                      {offer.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />} {offer.isActive ? "Pause" : "Activate"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {formOpen && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog business-offer-dialog" role="dialog" aria-modal="true" aria-labelledby="offer-form-title">
            <header><div><span className="eyebrow">Promotion setup</span><h2 id="offer-form-title">{editingId ? "Edit offer" : "Create an offer"}</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close offer form"><X size={18} /></button></header>
            <form onSubmit={save}>
              <label>Offer title<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} minLength={3} maxLength={160} required /></label>
              <label>Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} minLength={10} maxLength={3000} rows={4} required /></label>
              <div className="form-two-column">
                <label>Offer type<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as OfferForm["type"] }))}><option value="PERCENTAGE">Percentage off</option><option value="FLAT">Flat amount off</option><option value="FESTIVAL">Festival offer</option><option value="LIMITED_TIME">Limited time</option><option value="COUPON">Coupon</option><option value="COMBO">Combo</option><option value="NEW_CUSTOMER">New customer</option></select></label>
                <label>{form.type === "PERCENTAGE" ? "Discount percentage" : "Discount value (₹)"}<input type="number" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} min="0" max={form.type === "PERCENTAGE" ? "100" : undefined} step="0.01" required={form.type === "PERCENTAGE"} /></label>
              </div>
              <div className="form-two-column">
                <label>Coupon code (optional)<input value={form.couponCode} onChange={(event) => setForm((current) => ({ ...current, couponCode: event.target.value.toUpperCase() }))} maxLength={40} /></label>
                <label>Minimum spend (optional)<input type="number" value={form.minimumSpend} onChange={(event) => setForm((current) => ({ ...current, minimumSpend: event.target.value }))} min="0" step="0.01" /></label>
              </div>
              <div className="form-two-column">
                <label>Starts<input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} required /></label>
                <label>Ends<input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} required /></label>
              </div>
              <div className="form-two-column">
                <label>Maximum redemptions (optional)<input type="number" value={form.maxRedemptions} onChange={(event) => setForm((current) => ({ ...current, maxRedemptions: event.target.value }))} min="1" step="1" /></label>
                <label className="business-offer-checkbox"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} /> Request featured placement (admin approval required)</label>
              </div>
              <fieldset className="business-offer-catalogue">
                <legend>Apply to products</legend>
                <p>Select as many products as needed. Leave everything unchecked for a business-wide offer.</p>
                <div>{products.map((product) => <label key={product.id}><input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleSelection("productIds", product.id)} /><span>{product.name}<small>{product.status?.replaceAll("_", " ")}</small></span></label>)}</div>
              </fieldset>
              {services.length > 0 && (
                <fieldset className="business-offer-catalogue">
                  <legend>Apply to services</legend>
                  <div>{services.map((service) => <label key={service.id}><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleSelection("serviceIds", service.id)} /><span>{service.name}<small>{service.isActive ? "ACTIVE" : "PAUSED"}</small></span></label>)}</div>
                </fieldset>
              )}
              <footer><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />} Save offer</button></footer>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
