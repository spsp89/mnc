"use client";

import {
  Camera,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { uploadPrivateMedia } from "@/lib/private-media-upload";
import { formatCurrency } from "@/lib/utils";

type Shipment = {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  quotedAmount: string | number | null;
  trackingUrl: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  proof: {
    id: string;
    objectKey: string | null;
    receiverName: string;
    notes: string | null;
    capturedAt: string;
  } | null;
  settlement: {
    id: string;
    status: "PENDING" | "READY" | "SETTLED" | "DISPUTED";
    grossAmount: string | number;
    providerFee: string | number;
    netPayable: string | number;
    reference: string | null;
    settledAt: string | null;
  } | null;
  order: {
    orderNumber: string;
    status: string;
    deliveryAddress: unknown;
    total: string | number;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  fulfilmentType: string;
  status: string;
  total: string | number;
  deliveryAddress: unknown;
};

type Provider = { provider: string; configured: boolean; mode: string };

function safeTrackingUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function responseError(body: { message?: string | string[] }, fallback: string) {
  return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback;
}

export function BusinessDeliveriesManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [proofShipment, setProofShipment] = useState<Shipment | null>(null);
  const [settlementShipment, setSettlementShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const shipmentByOrder = useMemo(
    () => new Map(shipments.map((shipment) => [shipment.orderId, shipment])),
    [shipments],
  );
  const deliveryOrders = orders.filter((order) => order.fulfilmentType.toLowerCase() === "delivery");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [shipmentResponse, orderResponse] = await Promise.all([
        fetch(appPath(`/api/business/deliveries?businessId=${encodeURIComponent(businessId)}`)),
        fetch(appPath(`/api/orders/business?businessId=${encodeURIComponent(businessId)}`)),
      ]);
      const [shipmentBody, orderBody] = await Promise.all([
        shipmentResponse.json() as Promise<{ data?: Shipment[]; provider?: Provider; message?: string | string[] }>,
        orderResponse.json() as Promise<{ data?: Order[]; message?: string | string[] }>,
      ]);
      if (!shipmentResponse.ok) throw new Error(responseError(shipmentBody, "Deliveries could not be loaded."));
      if (!orderResponse.ok) throw new Error(responseError(orderBody, "Orders could not be loaded."));
      setShipments(shipmentBody.data ?? []);
      setProvider(shipmentBody.provider ?? null);
      setOrders(orderBody.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Deliveries could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function action(orderId: string, actionName: "quote" | "create" | "track" | "cancel") {
    setBusy(orderId);
    setNotice("");
    try {
      const response = actionName === "track"
        ? await fetch(appPath(`/api/business/deliveries/track?orderId=${encodeURIComponent(orderId)}`))
        : await fetch(appPath(`/api/business/deliveries/${actionName}`), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(responseError(body, "Delivery could not be updated."));
      setNotice(actionName === "quote"
        ? "Delivery quote saved."
        : actionName === "create"
          ? "Delivery request sent to the configured provider."
          : `Delivery ${actionName} completed.`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delivery could not be updated.");
    } finally {
      setBusy("");
    }
  }

  async function dispatch(
    shipment: Shipment,
    status: "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "FAILED",
  ) {
    let driverName = shipment.driverName ?? undefined;
    let driverPhone = shipment.driverPhone ?? undefined;
    let vehicleNumber = shipment.vehicleNumber ?? undefined;
    if (status === "ASSIGNED" && !driverName) {
      driverName = window.prompt("Driver or delivery partner name")?.trim() || undefined;
      if (!driverName) return;
      driverPhone = window.prompt("Driver phone (optional)")?.trim() || undefined;
      vehicleNumber = window.prompt("Vehicle number (optional)")?.trim() || undefined;
    }
    setBusy(shipment.orderId);
    try {
      const response = await fetch(appPath(`/api/business/deliveries/${shipment.orderId}/dispatch`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, driverName, driverPhone, vehicleNumber }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(responseError(body, "Dispatch status could not be updated."));
      setNotice(`Delivery marked ${status.toLowerCase().replaceAll("_", " ")} and the customer was notified.`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Dispatch status could not be updated.");
    } finally {
      setBusy("");
    }
  }

  async function captureProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proofShipment) return;
    const form = new FormData(event.currentTarget);
    const file = form.get("proof");
    if (!(file instanceof File) || !file.size) {
      setNotice("Choose a delivery proof image.");
      return;
    }
    setBusy(proofShipment.orderId);
    try {
      const upload = await uploadPrivateMedia(file, "delivery_proof", businessId);
      let coordinates: { latitude?: number; longitude?: number } = {};
      if (navigator.geolocation) {
        coordinates = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
            () => resolve({}),
            { enableHighAccuracy: true, timeout: 6_000, maximumAge: 30_000 },
          );
        });
      }
      const response = await fetch(appPath(`/api/business/deliveries/${proofShipment.orderId}/proof`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          objectKey: upload.objectKey,
          receiverName: form.get("receiverName"),
          notes: form.get("notes") || undefined,
          ...coordinates,
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(responseError(body, "Proof of delivery could not be saved."));
      setNotice("Proof captured securely. The order is delivered and settlement is ready.");
      setProofShipment(null);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Proof of delivery could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function settle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settlementShipment) return;
    const form = new FormData(event.currentTarget);
    setBusy(settlementShipment.orderId);
    try {
      const response = await fetch(appPath(`/api/business/deliveries/${settlementShipment.orderId}/settle`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerFee: Number(form.get("providerFee")),
          reference: form.get("reference"),
          notes: form.get("notes") || undefined,
        }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(responseError(body, "Delivery settlement could not be recorded."));
      setNotice("Delivery settlement recorded with a reconciliation reference.");
      setSettlementShipment(null);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delivery settlement could not be recorded.");
    } finally {
      setBusy("");
    }
  }

  async function viewProof(shipment: Shipment) {
    if (!shipment.proof?.objectKey) return;
    setBusy(shipment.orderId);
    try {
      const response = await fetch(appPath("/api/media/downloads"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose: "delivery_proof",
          businessId,
          objectKey: shipment.proof.objectKey,
          disposition: "inline",
        }),
      });
      const body = (await response.json()) as { data?: { downloadUrl: string }; message?: string | string[] };
      if (!response.ok || !body.data?.downloadUrl) throw new Error(responseError(body, "Proof image could not be opened."));
      window.open(body.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Proof image could not be opened.");
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div>
          <span className="eyebrow">Local fulfilment</span>
          <h1>Delivery lifecycle</h1>
          <p>Quote and dispatch through Porter or another configured adapter, record driver assignment, capture private proof of delivery and reconcile settlement.</p>
        </div>
        {user.businesses.length > 1 && <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select>}
      </section>
      {provider && <section className={`delivery-readiness ${provider.configured ? "ready" : "missing"}`}><Truck size={21} /><div><small>Active adapter</small><strong>{provider.provider} · {provider.mode}</strong><p>{provider.configured ? "Quote, dispatch, tracking and webhook sync are ready." : "Add provider base URL, token and webhook secret before external dispatch. The manual lifecycle remains available."}</p></div></section>}
      {notice && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {notice}</p>}
      <section className="manager-table-card">
        {loading ? (
          <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading delivery orders</strong></div>
        ) : deliveryOrders.length ? (
          <div className="business-delivery-list">
            {deliveryOrders.map((order) => {
              const shipment = shipmentByOrder.get(order.id);
              const trackingUrl = safeTrackingUrl(shipment?.trackingUrl);
              return (
                <article key={order.id}>
                  <span><PackageCheck size={18} /></span>
                  <div>
                    <small>{shipment?.status ?? "NOT DISPATCHED"} · {shipment?.provider ?? provider?.provider ?? "MANUAL"}</small>
                    <h2>{order.orderNumber}</h2>
                    <p><MapPin size={13} /> Delivery address stored securely with order · {formatCurrency(Number(order.total))}</p>
                    {shipment?.quotedAmount !== null && shipment?.quotedAmount !== undefined && <strong>Quote {formatCurrency(Number(shipment.quotedAmount))}</strong>}
                    {shipment?.driverName && <p><UserRound size={13} /> {shipment.driverName}{shipment.vehicleNumber ? ` · ${shipment.vehicleNumber}` : ""}{shipment.driverPhone ? ` · ${shipment.driverPhone}` : ""}</p>}
                    {shipment?.proof && <p><Camera size={13} /> Received by {shipment.proof.receiverName} · {new Date(shipment.proof.capturedAt).toLocaleString("en-IN")}</p>}
                    {shipment?.settlement && <p><CircleDollarSign size={13} /> Settlement {shipment.settlement.status} · net {formatCurrency(Number(shipment.settlement.netPayable))}{shipment.settlement.reference ? ` · ${shipment.settlement.reference}` : ""}</p>}
                  </div>
                  <div>
                    {!shipment && <button type="button" onClick={() => action(order.id, "quote")} disabled={busy === order.id}>Get quote</button>}
                    {(!shipment || ["QUOTED", "FAILED", "CANCELLED"].includes(shipment.status)) && <button type="button" onClick={() => action(order.id, "create")} disabled={busy === order.id}><Truck size={14} /> Dispatch</button>}
                    {shipment && !["DELIVERED", "CANCELLED", "FAILED"].includes(shipment.status) && <button type="button" onClick={() => action(order.id, "track")} disabled={busy === order.id}><RefreshCw size={14} /> Sync provider</button>}
                    {shipment?.status === "REQUESTED" && <button type="button" onClick={() => dispatch(shipment, "ASSIGNED")} disabled={busy === order.id}>Assign driver</button>}
                    {shipment?.status === "ASSIGNED" && <button type="button" onClick={() => dispatch(shipment, "PICKED_UP")} disabled={busy === order.id}>Mark picked up</button>}
                    {shipment && ["PICKED_UP", "IN_TRANSIT"].includes(shipment.status) && <><button type="button" onClick={() => dispatch(shipment, "IN_TRANSIT")} disabled={busy === order.id}>In transit</button><button type="button" onClick={() => setProofShipment(shipment)} disabled={busy === order.id}><Camera size={14} /> Capture proof</button></>}
                    {shipment && !["DELIVERED", "CANCELLED", "FAILED"].includes(shipment.status) && <button type="button" onClick={() => action(order.id, "cancel")} disabled={busy === order.id}>Cancel</button>}
                    {shipment?.proof?.objectKey && <button type="button" onClick={() => viewProof(shipment)} disabled={busy === order.id}>View proof</button>}
                    {shipment?.settlement?.status === "READY" && <button type="button" onClick={() => setSettlementShipment(shipment)} disabled={busy === order.id}><CircleDollarSign size={14} /> Record settlement</button>}
                    {trackingUrl && <a href={trackingUrl} target="_blank" rel="noreferrer">Live tracking</a>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="admin-empty"><Truck size={28} /><strong>No delivery orders</strong><span>Orders placed with delivery fulfilment will appear here.</span></div>}
      </section>
      {proofShipment && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog" role="dialog" aria-modal="true" aria-labelledby="proof-title">
            <header><div><span className="eyebrow">{proofShipment.order.orderNumber}</span><h2 id="proof-title">Capture proof of delivery</h2></div><button type="button" onClick={() => setProofShipment(null)} aria-label="Close proof form"><X size={18} /></button></header>
            <form onSubmit={captureProof}><label>Proof image<input name="proof" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label>Received by<input name="receiverName" minLength={2} maxLength={120} required /></label><label>Delivery note<textarea name="notes" maxLength={1000} rows={4} placeholder="Condition, location or handover note" /></label><p className="delivery-proof-note">The image is stored privately with checksum verification. GPS is attached when browser permission is available.</p><footer><button type="button" onClick={() => setProofShipment(null)}>Cancel</button><button type="submit" disabled={busy === proofShipment.orderId}>{busy === proofShipment.orderId ? <LoaderCircle className="spin" size={15} /> : <Camera size={15} />} Complete delivery</button></footer></form>
          </section>
        </div>
      )}
      {settlementShipment?.settlement && (
        <div className="business-product-dialog-backdrop" role="presentation">
          <section className="business-product-dialog" role="dialog" aria-modal="true" aria-labelledby="settlement-title">
            <header><div><span className="eyebrow">{settlementShipment.order.orderNumber}</span><h2 id="settlement-title">Reconcile delivery settlement</h2></div><button type="button" onClick={() => setSettlementShipment(null)} aria-label="Close settlement form"><X size={18} /></button></header>
            <form onSubmit={settle}><label>Provider fee<input name="providerFee" type="number" min="0" max="10000000" step="0.01" defaultValue={Number(settlementShipment.settlement.providerFee)} required /></label><label>Settlement reference<input name="reference" minLength={2} maxLength={120} placeholder="UTR, payout or invoice reference" required /></label><label>Notes<textarea name="notes" maxLength={1000} rows={4} /></label><footer><button type="button" onClick={() => setSettlementShipment(null)}>Cancel</button><button type="submit" disabled={busy === settlementShipment.orderId}><CircleDollarSign size={15} /> Mark settled</button></footer></form>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
