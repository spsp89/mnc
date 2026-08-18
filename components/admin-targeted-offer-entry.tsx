"use client";

import { CheckCircle2, Gift, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Customer = { id: string; email: string | null; phone: string | null; role: string; customerProfile: { displayName: string | null } | null };
type Item = { id: string; name: string };
type Business = { id: string; name: string; products: Item[]; services: Item[] };

const apiMessage = (body: { message?: string | string[] } | null, fallback: string) => Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? fallback;
const localDateTime = (date: Date) => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
};

export function AdminTargetedOfferEntry() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const business = useMemo(() => businesses.find((item) => item.id === businessId), [businessId, businesses]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetch("/api/admin/offers/options", { signal: controller.signal }).then(async (response) => {
      const body = await response.json() as { data?: { customers?: Customer[]; businesses?: Business[] }; message?: string | string[] };
      if (!response.ok) throw new Error(apiMessage(body, "Offer options could not be loaded."));
      setCustomers(body.data?.customers ?? []); setBusinesses(body.data?.businesses ?? []);
    }).catch((caught) => {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Offer options could not be loaded.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);

  const toggle = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const openDialog = () => { setLoading(true); setError(""); setOpen(true); };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/offers/targeted", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        customerId, businessId, title: form.get("title"), description: form.get("description"), type: form.get("type"),
        discountValue: form.get("discountValue") === "" ? undefined : Number(form.get("discountValue")), couponCode: form.get("couponCode"),
        minimumSpend: form.get("minimumSpend") === "" ? undefined : Number(form.get("minimumSpend")), maxRedemptions: Number(form.get("maxRedemptions") || 1),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(), endsAt: new Date(String(form.get("endsAt"))).toISOString(),
        productIds, serviceIds, reason: form.get("reason"),
      }) });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(apiMessage(body, "Private offer could not be created."));
      setOpen(false); setNotice("Private offer created, approved, audited, and sent only to the selected customer.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Private offer could not be created."); }
    finally { setSaving(false); }
  };

  const starts = new Date(); starts.setMinutes(starts.getMinutes() + 5);
  const ends = new Date(starts); ends.setDate(ends.getDate() + 7);
  return <>
    {notice && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {notice}</p>}
    <section className="admin-finance-create-bar"><div><strong>Customer-specific offers</strong><span>Create a private, single-customer coupon tied to a business and optional catalogue items.</span></div><button type="button" onClick={openDialog}><Gift size={17} /> Create private offer</button></section>
    {open && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-offer-modal" role="dialog" aria-modal="true" aria-labelledby="targeted-offer-title"><header><div><small>Audited customer promotion</small><h2 id="targeted-offer-title">Create private offer</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close private offer form"><X size={18} /></button></header><form onSubmit={submit}>
      {loading && <p className="admin-create-note"><LoaderCircle className="spin" size={16} /> Loading customers and catalogue…</p>}
      <div className="admin-manual-payment-grid"><label>Customer<select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={loading}><option value="">Select customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.customerProfile?.displayName || customer.email || customer.phone || customer.id} · {customer.role.replaceAll("_", " ")}</option>)}</select></label><label>Business<select required value={businessId} onChange={(event) => { setBusinessId(event.target.value); setProductIds([]); setServiceIds([]); }} disabled={loading}><option value="">Select business</option>{businesses.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div>
      {!loading && (!customers.length || !businesses.length) && <p className="admin-action-warning">An active customer and an active business are required before a private offer can be created.</p>}
      <label>Offer title<input name="title" minLength={3} maxLength={160} required placeholder="A special offer just for you" /></label>
      <label>Description<textarea name="description" minLength={10} maxLength={3000} required placeholder="Explain the benefit and any conditions" /></label>
      <div className="admin-offer-fields"><label>Offer type<select name="type" defaultValue="PERCENTAGE"><option value="PERCENTAGE">Percentage discount</option><option value="FLAT">Flat discount</option><option value="COUPON">Coupon</option><option value="LIMITED_TIME">Limited time</option><option value="COMBO">Combo</option><option value="FESTIVAL">Festival</option><option value="NEW_CUSTOMER">New customer</option></select></label><label>Discount value<input name="discountValue" type="number" min="0" step="0.01" required /></label><label>Private coupon code<input name="couponCode" minLength={3} maxLength={40} required pattern="[A-Za-z0-9_-]+" placeholder="CUSTOMER25" /></label></div>
      <div className="admin-offer-fields"><label>Minimum spend (₹)<input name="minimumSpend" type="number" min="0" step="0.01" /></label><label>Maximum redemptions<input name="maxRedemptions" type="number" min="1" max="1000000" step="1" defaultValue="1" required /></label><span /></div>
      <div className="admin-manual-payment-grid"><label>Starts at<input name="startsAt" type="datetime-local" defaultValue={localDateTime(starts)} required /></label><label>Ends at<input name="endsAt" type="datetime-local" defaultValue={localDateTime(ends)} required /></label></div>
      {business && <fieldset className="admin-offer-catalog"><legend>Eligible catalogue items (optional)</legend><div><strong>Products</strong>{business.products.length ? business.products.map((item) => <label key={item.id}><input type="checkbox" checked={productIds.includes(item.id)} onChange={() => toggle(item.id, setProductIds)} /> {item.name}</label>) : <span>No active products</span>}</div><div><strong>Services</strong>{business.services.length ? business.services.map((item) => <label key={item.id}><input type="checkbox" checked={serviceIds.includes(item.id)} onChange={() => toggle(item.id, setServiceIds)} /> {item.name}</label>) : <span>No active services</span>}</div></fieldset>}
      <label>Audit reason<textarea name="reason" minLength={8} maxLength={1000} required placeholder="Why this customer is receiving the private offer" /></label>
      <p className="admin-safety-note"><ShieldCheck size={15} /> This offer is excluded from public discovery and merchant editing. Only the selected customer can view and redeem its coupon.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" disabled={saving || loading || !customerId || !businessId}>{saving ? <LoaderCircle className="spin" size={15} /> : <Gift size={15} />} Create and notify</button></footer>
    </form></section></div>}
  </>;
}
