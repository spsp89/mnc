"use client";

import { ArrowLeft, CheckCircle2, Clock3, Download, LoaderCircle, MapPin, PackageCheck, RotateCcw, Send, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type OrderDetail = {
  id: string;
  businessId: string;
  orderNumber: string;
  status: string;
  fulfilmentType: string;
  subtotal: number | string;
  discount: number | string;
  deliveryFee: number | string;
  total: number | string;
  createdAt: string;
  business: { name: string; slug: string };
  items: Array<{ id: string; nameSnapshot: string; quantity: number; unitPrice: number | string; total: number | string }>;
  payments: Array<{ status: string }>;
  review: { id: string; status: string; overallRating: number } | null;
};

export function OrderDetailView({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    fetch(appPath(`/api/orders/${id}`))
      .then(async (response) => {
        const body = await response.json() as { data?: OrderDetail; message?: string };
        if (!response.ok || !body.data) throw new Error(body.message ?? "Order unavailable.");
        setOrder(body.data);
        setState("ready");
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "Order unavailable.");
        setState("error");
      });
  }, [id]);

  async function update(action: "cancel" | "return") {
    setMessage("");
    const response = await fetch(appPath(`/api/orders/${id}/${action}`), {
      method: "POST",
    });
    const body = await response.json() as { data?: { status: string }; message?: string };
    if (!response.ok || !body.data) {
      setMessage(body.message ?? "The order could not be updated.");
      return;
    }
    setOrder((current) => current ? { ...current, status: body.data?.status ?? current.status } : current);
    setMessage(action === "cancel" ? "Order cancelled." : "Return request opened.");
  }

  function downloadInvoice() {
    if (!order) return;
    const lines = [
      "BNC MARKETPLACE INVOICE",
      `Order: ${order.orderNumber}`,
      `Business: ${order.business.name}`,
      `Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`,
      "",
      ...order.items.map((item) => `${item.nameSnapshot} × ${item.quantity} — ${formatCurrency(Number(item.total))}`),
      "",
      `Subtotal: ${formatCurrency(Number(order.subtotal))}`,
      `Discount: ${formatCurrency(Number(order.discount))}`,
      `Delivery: ${formatCurrency(Number(order.deliveryFee))}`,
      `Total: ${formatCurrency(Number(order.total))}`,
      `Payment: ${order.payments[0]?.status ?? "Pending"}`,
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${order.orderNumber}-invoice.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function submitVerifiedReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setReviewBusy(true);
    setReviewMessage("");
    try {
      const response = await fetch(appPath("/api/reviews"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: order.businessId,
          orderId: order.id,
          overallRating: Number(fields.get("overallRating")),
          body: String(fields.get("body") ?? "").trim(),
          recommended: fields.get("recommended") === "on",
        }),
      });
      const body = await response.json() as { data?: { id: string; status: string; overallRating: number }; message?: string | string[] };
      if (!response.ok || !body.data) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Review could not be submitted.");
      }
      setOrder((current) => current ? { ...current, review: body.data ?? null } : current);
      setReviewMessage("Your verified-purchase review was submitted for integrity checks.");
      form.reset();
    } catch (caught) {
      setReviewMessage(caught instanceof Error ? caught.message : "Review could not be submitted.");
    } finally {
      setReviewBusy(false);
    }
  }

  if (state === "loading") return <div className="orders-state"><LoaderCircle className="spin" size={28} /><p>Loading order…</p></div>;
  if (state === "error" || !order) return <div className="orders-state"><PackageCheck size={30} /><h2>We could not open this order</h2><p>{message}</p><Link href="/login">Verify mobile</Link></div>;

  const stages = ["PENDING", "CONFIRMED", "PREPARING", order.fulfilmentType === "pickup" ? "READY_FOR_PICKUP" : "DISPATCHED", "DELIVERED"];
  const currentStage = stages.indexOf(order.status);

  return (
    <section className="order-detail-page">
      <Link className="back-link" href="/orders"><ArrowLeft size={15} /> All orders</Link>
      <div className="order-detail-heading"><div><span className="eyebrow">Order {order.orderNumber}</span><h1>{order.business.name}</h1><p>Placed {new Date(order.createdAt).toLocaleString("en-IN")}</p></div><strong>{order.status.replaceAll("_", " ")}</strong></div>
      <div className="order-timeline">{stages.map((stage, index) => <div className={index <= currentStage ? "complete" : ""} key={stage}><span>{index <= currentStage ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span><small>{stage.replaceAll("_", " ")}</small></div>)}</div>
      <div className="order-detail-layout">
        <section><h2>Items</h2>{order.items.map((item) => <article key={item.id}><span><PackageCheck size={18} /></span><div><strong>{item.nameSnapshot}</strong><small>{formatCurrency(Number(item.unitPrice))} × {item.quantity}</small></div><b>{formatCurrency(Number(item.total))}</b></article>)}</section>
        <aside><h2>Payment summary</h2><dl><div><dt>Subtotal</dt><dd>{formatCurrency(Number(order.subtotal))}</dd></div><div><dt>Discount</dt><dd>−{formatCurrency(Number(order.discount))}</dd></div><div><dt>{order.fulfilmentType === "delivery" ? "Delivery" : "Pickup"}</dt><dd>{formatCurrency(Number(order.deliveryFee))}</dd></div><div><dt>Total</dt><dd>{formatCurrency(Number(order.total))}</dd></div></dl><p><MapPin size={14} /> {order.fulfilmentType === "delivery" ? "Local delivery" : "Store pickup"}</p>{message && <small role="status">{message}</small>}{order.payments.some((payment) => payment.status === "CAPTURED") && <button type="button" onClick={downloadInvoice}><Download size={14} /> Download invoice</button>}{["PENDING", "CONFIRMED"].includes(order.status) && <button type="button" onClick={() => update("cancel")}>Cancel eligible order</button>}{order.status === "DELIVERED" && <button type="button" onClick={() => update("return")}><RotateCcw size={14} /> Request return</button>}</aside>
      </div>
      {["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(order.status) && (
        <section className="verified-purchase-review">
          <div className="verified-purchase-review-heading">
            <span><ShieldCheck size={22} /></span>
            <div><small>Verified purchase</small><h2>Share your real experience</h2><p>Your words stay yours. BNC does not generate ratings or pretend that a customer was happy.</p></div>
          </div>
          {order.review ? (
            <div className="verified-review-complete"><CheckCircle2 size={20} /><div><strong>Review submitted · {order.review.overallRating}/5</strong><span>Status: {order.review.status.toLowerCase()}</span></div></div>
          ) : (
            <form onSubmit={submitVerifiedReview}>
              <label>Rating<select name="overallRating" defaultValue="5" required><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Okay</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label>
              <label className="verified-review-copy">Your experience<textarea name="body" minLength={20} maxLength={3000} rows={4} required placeholder="Describe what you purchased and what genuinely happened." /></label>
              <label className="verified-review-check"><input name="recommended" type="checkbox" /> I would recommend this business</label>
              {reviewMessage && <p role="status">{reviewMessage}</p>}
              <button type="submit" disabled={reviewBusy}>{reviewBusy ? <LoaderCircle className="spin" size={15} /> : <><Send size={15} /> Submit genuine review</>}</button>
            </form>
          )}
          <small className="verified-review-policy"><Star size={13} /> Only the purchasing customer can submit this review. Fabricated or incentivised content is prohibited.</small>
        </section>
      )}
    </section>
  );
}
