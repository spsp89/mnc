"use client";

import { CheckCircle2, LoaderCircle, PackagePlus, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Customer = { id: string; email: string | null; phone: string | null; role: string; customerProfile: { displayName: string | null } | null };
type Variant = { id: string; name: string; sku: string; price: string | number | null; stock: number };
type Product = { id: string; name: string; price: string | number; discountPrice: string | number | null; minimumOrderQty: number; variants: Variant[] };
type Business = { id: string; name: string; products: Product[] };
type Line = { productId: string; variantId: string; quantity: number };

const message = (body: { message?: string | string[] } | null, fallback: string) => Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? fallback;

export function AdminOrderEntry() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
  const [lines, setLines] = useState<Line[]>([{ productId: "", variantId: "", quantity: 1 }]);
  const business = businesses.find((item) => item.id === businessId);
  const subtotal = useMemo(() => lines.reduce((sum, line) => {
    const product = business?.products.find((item) => item.id === line.productId);
    const variant = product?.variants.find((item) => item.id === line.variantId);
    return sum + Number(variant?.price ?? product?.discountPrice ?? product?.price ?? 0) * Number(line.quantity || 0);
  }, 0), [business, lines]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/admin/orders/options", { signal: controller.signal });
        const body = await response.json() as { data?: { customers?: Customer[]; businesses?: Business[] }; message?: string | string[] };
        if (!response.ok) throw new Error(message(body, "Order options could not be loaded."));
        setCustomers(body.data?.customers ?? []); setBusinesses(body.data?.businesses ?? []);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Order options could not be loaded.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [open]);

  const updateLine = (index: number, patch: Partial<Line>) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const deliveryAddress = fulfilmentType === "delivery" ? {
      addressLine1: form.get("addressLine1"), addressLine2: form.get("addressLine2"), city: form.get("city"),
      state: form.get("state"), postalCode: form.get("postalCode"),
    } : undefined;
    try {
      const response = await fetch("/api/admin/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        customerId, businessId, externalReference: form.get("externalReference"), fulfilmentType, deliveryAddress,
        discount: Number(form.get("discount") || 0), tax: Number(form.get("tax") || 0), deliveryFee: Number(form.get("deliveryFee") || 0),
        notes: form.get("notes"), reason: form.get("reason"), items: lines,
      }) });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(message(body, "Manual order could not be created."));
      setOpen(false); setNotice("Manual order created as pending with recalculated totals, reserved stock, customer notification, and audit evidence.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Manual order could not be created."); }
    finally { setSaving(false); }
  };

  return <>
    {notice && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {notice}</p>}
    <section className="admin-finance-create-bar"><div><strong>Operations-entered orders</strong><span>Create a pending order from existing customers, businesses, products and live catalogue prices. Payment remains separate.</span></div><button type="button" onClick={() => setOpen(true)}><PackagePlus size={17} /> Enter manual order</button></section>
    {open && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="manual-order-title"><header><div><small>Audited operations entry</small><h2 id="manual-order-title">Enter manual order</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close manual order form"><X size={18} /></button></header><form onSubmit={submit}>
      {loading && <p className="admin-create-note"><LoaderCircle className="spin" size={16} /> Loading customers and catalogue…</p>}
      <div className="admin-manual-payment-grid"><label>Customer<select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={loading}><option value="">Select customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.customerProfile?.displayName || customer.email || customer.phone || customer.id} · {customer.role.replaceAll("_", " ")}</option>)}</select></label><label>Business<select required value={businessId} onChange={(event) => { setBusinessId(event.target.value); setLines([{ productId: "", variantId: "", quantity: 1 }]); }} disabled={loading}><option value="">Select business</option>{businesses.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.products.length} products</option>)}</select></label></div>
      {!loading && (!customers.length || !businesses.length) && <p className="admin-action-warning">An active customer and an active business with published products are required.</p>}
      <label>External invoice / order reference<input name="externalReference" minLength={3} maxLength={120} required placeholder="POS invoice, phone order, or counter reference" /></label>
      <div className="admin-manual-payment-grid"><label>Fulfilment<select value={fulfilmentType} onChange={(event) => setFulfilmentType(event.target.value as "pickup" | "delivery")}><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label><label>Catalogue subtotal preview<input readOnly value={formatCurrency(subtotal)} /><small>The backend recalculates every price and the final total when saved.</small></label></div>
      <fieldset className="admin-order-lines"><legend>Order items</legend>{lines.map((line, index) => { const product = business?.products.find((item) => item.id === line.productId); return <div key={index}><label>Product<select required value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value, variantId: "", quantity: business?.products.find((item) => item.id === event.target.value)?.minimumOrderQty ?? 1 })} disabled={!business}><option value="">Select product</option>{business?.products.map((item) => <option value={item.id} key={item.id}>{item.name} · {formatCurrency(Number(item.discountPrice ?? item.price))}</option>)}</select></label><label>Variant<select value={line.variantId} onChange={(event) => updateLine(index, { variantId: event.target.value })} disabled={!product?.variants.length}><option value="">Standard</option>{product?.variants.map((variant) => <option value={variant.id} key={variant.id} disabled={variant.stock < line.quantity}>{variant.name} · {variant.sku} · {variant.stock} available</option>)}</select></label><label>Quantity<input type="number" min={product?.minimumOrderQty ?? 1} max="1000" step="1" required value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /></label><button type="button" aria-label="Remove order item" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><Trash2 size={16} /></button></div>; })}<button type="button" className="secondary" disabled={!business || lines.length >= 50} onClick={() => setLines((current) => [...current, { productId: "", variantId: "", quantity: 1 }])}><Plus size={15} /> Add item</button></fieldset>
      <div className="admin-order-adjustments"><label>Discount (₹)<input name="discount" type="number" min="0" max={subtotal} step="0.01" defaultValue="0" /></label><label>Tax (₹)<input name="tax" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Delivery fee (₹)<input name="deliveryFee" type="number" min="0" step="0.01" defaultValue="0" disabled={fulfilmentType === "pickup"} /></label></div>
      {fulfilmentType === "delivery" && <div className="admin-order-address"><label>Address line 1<input name="addressLine1" required minLength={2} /></label><label>Address line 2<input name="addressLine2" /></label><label>City<input name="city" required minLength={2} /></label><label>State<input name="state" required minLength={2} /></label><label>Postal code<input name="postalCode" required minLength={2} maxLength={12} /></label></div>}
      <label>Order notes (optional)<textarea name="notes" maxLength={1000} rows={3} placeholder="Phone-order, counter-sale, or fulfilment instructions" /></label>
      <label>Audit reason<textarea name="reason" minLength={8} maxLength={1000} rows={3} required placeholder="Why operations is entering this order" /></label>
      <p className="admin-safety-note"><ShieldAlert size={15} /> Product and variant prices come from the server catalogue. The order starts pending and this action does not create a payment or mark the order paid.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" disabled={saving || loading || !customerId || !businessId || !lines.every((line) => line.productId && line.quantity > 0)}>{saving ? <LoaderCircle className="spin" size={15} /> : <PackagePlus size={15} />} Create pending order</button></footer>
    </form></section></div>}
  </>;
}
