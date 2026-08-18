"use client";

import { CheckCircle2, Clock3, Copy, Gift, LoaderCircle, PackageCheck, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";
import type { BncSessionUser } from "@/lib/auth-types";

type BusinessOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  fulfilmentType: string;
  createdAt: string;
  customer: { customerProfile: { displayName: string | null } | null };
  items: Array<{ id: string; nameSnapshot: string; quantity: number }>;
};

type ActiveDraw = {
  id: string;
  title: string;
  kind: "WEEKLY" | "MONTHLY" | "FESTIVAL";
  occasion?: string | null;
  minimumPurchase: number | string;
  weekEndsAt: string;
  status: string;
};

const nextStatus: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "DISPATCHED", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
};

export function BusinessOrdersView({ user }: { user: BncSessionUser }) {
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [message, setMessage] = useState("");
  const [draws, setDraws] = useState<ActiveDraw[]>([]);
  const [issuedCode, setIssuedCode] = useState("");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    const businessId = user.businesses[0]?.id;
    if (!businessId) {
      Promise.resolve().then(() => setState("unavailable"));
      return;
    }
    Promise.all([
      fetch(appPath(`/api/orders/business?businessId=${encodeURIComponent(businessId)}`)),
      fetch(appPath("/api/weekly-draws")),
    ])
      .then(async ([ordersResponse, drawsResponse]) => {
        const ordersBody = await ordersResponse.json() as { data?: BusinessOrder[] };
        const drawsBody = await drawsResponse.json() as { data?: ActiveDraw[] };
        if (!ordersResponse.ok) throw new Error();
        setOrders(ordersBody.data ?? []);
        setDraws((drawsBody.data ?? []).filter((draw) => draw.status === "OPEN"));
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [user.businesses]);

  async function move(order: BusinessOrder, status: string) {
    setMessage("");
    const response = await fetch(appPath(`/api/orders/${order.id}/status`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json() as { data?: { status: string }; message?: string };
    if (!response.ok || !body.data) {
      setMessage(body.message ?? "Order status could not be updated.");
      return;
    }
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: body.data?.status ?? item.status } : item));
    setMessage(`${order.orderNumber} moved to ${body.data.status.replaceAll("_", " ").toLowerCase()}.`);
  }

  async function issueRewardId(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const businessId = user.businesses[0]?.id;
    if (!businessId) return;
    const form = new FormData(event.currentTarget);
    setIssuing(true);
    setIssuedCode("");
    try {
      const drawId = String(form.get("drawId") ?? "");
      const response = await fetch(appPath(`/api/weekly-draws/${encodeURIComponent(drawId)}/entries`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          purchaseAmount: Number(form.get("purchaseAmount")),
          receiptReference: form.get("receiptReference") || undefined,
        }),
      });
      const body = await response.json() as { data?: { code: string }; message?: string | string[] };
      if (!response.ok || !body.data?.code) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Reward ID could not be issued.");
      }
      setIssuedCode(body.data.code);
      setMessage("Unique reward ID created. Give it to the customer so they can claim their entry.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reward ID could not be issued.");
    } finally {
      setIssuing(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading"><div><span className="eyebrow">Marketplace fulfilment</span><h1>Orders</h1><p>Accept orders, move fulfilment forward and keep customer tracking accurate.</p></div></section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={14} /> {message}</p>}
      {draws.length > 0 && (
        <section className="merchant-reward-panel">
          <div><Gift size={22} /><span><small>Customer rewards</small><strong>Issue a unique draw ID for purchases of ₹200 or more</strong></span></div>
          <form onSubmit={issueRewardId}>
            <select name="drawId" aria-label="Reward draw" required>
              {draws.map((draw) => <option value={draw.id} key={draw.id}>{draw.kind === "FESTIVAL" ? `${draw.occasion ?? "Festival"} bumper` : draw.title}</option>)}
            </select>
            <input name="purchaseAmount" type="number" min={200} step="0.01" placeholder="Purchase amount" required />
            <input name="receiptReference" maxLength={120} placeholder="Receipt reference (optional)" />
            <button type="submit" disabled={issuing}>{issuing ? <LoaderCircle className="spin" size={15} /> : <Gift size={15} />} Generate ID</button>
          </form>
          {issuedCode && <div className="merchant-issued-code"><code>{issuedCode}</code><button type="button" onClick={() => navigator.clipboard.writeText(issuedCode)}><Copy size={14} /> Copy</button></div>}
          <p>BNC never receives the purchase payment. The merchant confirms the amount and the customer claims this ID in BNC.</p>
        </section>
      )}
      {state === "loading" && <div className="manager-api-state"><LoaderCircle className="spin" /><p>Loading protected orders…</p></div>}
      {state === "unavailable" && <div className="manager-api-state"><PackageCheck /><h2>Connect a business owner session</h2><p>Sign in and select a backend business account to manage live orders.</p></div>}
      {state === "error" && <div className="manager-api-state"><RefreshCw /><h2>Orders are temporarily unavailable</h2><p>No fulfilment state was changed.</p></div>}
      {state === "ready" && !orders.length && <div className="manager-api-state"><PackageCheck /><h2>No orders to fulfil</h2><p>New paid and pending orders will appear here.</p></div>}
      {state === "ready" && orders.length > 0 && <section className="manager-table-card"><div className="business-order-list">{orders.map((order) => <article key={order.id}><span><PackageCheck size={19} /></span><div><small>{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</small><h2>{order.items.map((item) => `${item.nameSnapshot} × ${item.quantity}`).join(", ")}</h2><p>{order.customer.customerProfile?.displayName ?? "Verified customer"} · {order.fulfilmentType}</p></div><div><strong>{formatCurrency(Number(order.total))}</strong><span><Clock3 size={12} /> {order.status.replaceAll("_", " ")}</span></div><select aria-label={`Update ${order.orderNumber}`} value="" onChange={(event) => event.target.value && move(order, event.target.value)}><option value="">Next action</option>{(nextStatus[order.status] ?? []).map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></article>)}</div></section>}
    </DashboardShell>
  );
}
