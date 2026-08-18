"use client";

import { ArrowRight, Clock3, LoaderCircle, PackageCheck, RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  fulfilmentType: string;
  createdAt: string;
  business: { name: string; slug: string };
  items: Array<{ id: string; nameSnapshot: string; quantity: number }>;
};

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unauthenticated" | "error">("loading");

  useEffect(() => {
    fetch(appPath("/api/orders"))
      .then(async (response) => {
        const body = await response.json() as { data?: Order[] };
        if (response.status === 401) {
          setState("unauthenticated");
          return;
        }
        if (!response.ok) throw new Error("Unable to load orders.");
        setOrders(body.data ?? []);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  return (
    <section className="orders-page">
      <div className="orders-heading"><span className="eyebrow">Marketplace activity</span><h1>Your orders</h1><p>Track pickup, delivery, payment and return status from one place.</p></div>
      {state === "loading" && <div className="orders-state"><LoaderCircle className="spin" size={28} /><p>Loading secure order history…</p></div>}
      {state === "unauthenticated" && <div className="orders-state"><ShoppingBag size={30} /><h2>Verify your mobile to see orders</h2><p>Order history is read from the protected BNC API.</p><Link href="/login">Continue to sign in</Link></div>}
      {state === "error" && <div className="orders-state"><RefreshCw size={30} /><h2>Order history is unavailable</h2><p>The API may be restarting. No order status was changed.</p><button type="button" onClick={() => location.reload()}>Try again</button></div>}
      {state === "ready" && !orders.length && <div className="orders-state"><PackageCheck size={30} /><h2>No marketplace orders yet</h2><p>Products that support BNC checkout show an Add to cart action.</p><Link href="/products">Browse products</Link></div>}
      {state === "ready" && orders.length > 0 && <div className="order-list">{orders.map((order) => <article key={order.id}><span><PackageCheck size={20} /></span><div><small>{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</small><h2>{order.business.name}</h2><p>{order.items.map((item) => `${item.nameSnapshot} × ${item.quantity}`).join(", ")}</p></div><div><strong>{formatCurrency(Number(order.total))}</strong><span><Clock3 size={13} /> {order.status.replaceAll("_", " ")}</span></div><Link href={`/orders/${order.id}`}>Track <ArrowRight size={14} /></Link></article>)}</div>}
    </section>
  );
}
