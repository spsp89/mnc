"use client";

import { CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, MapPin, Minus, PackageCheck, Plus, ShoppingBag, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { featuredProducts } from "@/lib/catalog-data";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type RazorpayCheckout = {
  open(): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

async function loadRazorpay() {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function CartView({ initialProductId }: { initialProductId?: string }) {
  const product = featuredProducts.find((item) => item.id === initialProductId);
  const participating = Boolean(product?.checkout && product.businessId);
  const [quantity, setQuantity] = useState(1);
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("pickup");
  const [coupon, setCoupon] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "payment" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const unitPrice = product ? product.discountPrice ?? product.price : 0;
  const itemSubtotal = unitPrice * quantity;

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product?.businessId) {
      setState("error");
      setMessage("This product is not available for backend checkout.");
      return;
    }
    if (!participating) {
      setState("error");
      setMessage("This seller currently accepts direct enquiries rather than BNC checkout.");
      return;
    }
    setState("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const orderResponse = await fetch(appPath("/api/orders"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: product.businessId,
          fulfilmentType: fulfilment,
          deliveryAddress: fulfilment === "delivery"
            ? { address: String(form.get("address") ?? ""), city: "Kochi", state: "Kerala" }
            : undefined,
          couponCode: coupon.trim() || undefined,
          notes: String(form.get("notes") ?? ""),
          items: [{ productId: product.id, quantity }],
        }),
      });
      const orderBody = await orderResponse.json() as { data?: { id: string; orderNumber: string }; message?: string };
      if (!orderResponse.ok || !orderBody.data) throw new Error(orderBody.message ?? "Order could not be created.");
      setOrderId(orderBody.data.id);

      const paymentResponse = await fetch(appPath("/api/payments/checkout"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: orderBody.data.id,
          idempotencyKey: `web-${orderBody.data.id}-${crypto.randomUUID()}`,
        }),
      });
      const paymentBody = await paymentResponse.json() as {
        data?: { keyId: string; providerOrderId: string; amountSubunits: number; currency: string };
        message?: string;
      };
      if (!paymentResponse.ok || !paymentBody.data?.providerOrderId) {
        throw new Error(paymentBody.message ?? "Payment checkout could not be prepared.");
      }
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) throw new Error("Secure payment window could not load.");
      setState("payment");
      const payment = new window.Razorpay({
        key: paymentBody.data.keyId,
        order_id: paymentBody.data.providerOrderId,
        amount: paymentBody.data.amountSubunits,
        currency: paymentBody.data.currency,
        name: "BNC",
        description: product.name,
        handler: () => {
          setState("success");
          setMessage("Payment submitted. BNC will update the order after signed provider confirmation.");
        },
        modal: {
          ondismiss: () => {
            setState("idle");
            setMessage("Payment was not completed. Your pending order remains visible in order history.");
          },
        },
        theme: { color: "#0f48d8" },
      });
      payment.open();
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Checkout could not be completed.");
    }
  }

  if (!product) {
    return <section className="cart-page"><div className="empty-state"><ShoppingBag size={30} /><h1>Your cart is empty</h1><p>Add a backend-supplied marketplace product to begin checkout.</p><Link href="/products">Browse products</Link></div></section>;
  }

  return (
    <section className="cart-page">
      <div className="cart-heading"><span className="eyebrow">Participating marketplace checkout</span><h1>Your local cart</h1><p>Price, coupon and stock are rechecked by the BNC API before an order is created.</p></div>
      <form className="cart-layout" onSubmit={checkout}>
        <div className="cart-main">
          <article className="cart-item">
            <div><Image src={product.image} alt={product.name} fill sizes="120px" /></div>
            <section><small>{product.category}</small><h2>{product.name}</h2><p><Store size={13} /> {product.sellerName ?? "BNC local seller"} · {product.sellerCity ?? "Kerala"}</p><span><PackageCheck size={14} /> {participating ? "BNC checkout available" : "Direct seller enquiry only"}</span></section>
            <div className="cart-quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Increase quantity"><Plus size={14} /></button></div>
            <strong>{formatCurrency(unitPrice * quantity)}</strong>
          </article>

          <section className="fulfilment-card">
            <h2>How would you like it?</h2>
            <div><button type="button" className={fulfilment === "pickup" ? "active" : ""} onClick={() => setFulfilment("pickup")}><ShoppingBag size={17} /> Store pickup<small>Availability confirmed by backend</small></button><button type="button" className={fulfilment === "delivery" ? "active" : ""} onClick={() => setFulfilment("delivery")}><MapPin size={17} /> Local delivery<small>Fee and service area confirmed by backend</small></button></div>
            {fulfilment === "delivery" && <label>Delivery address<textarea name="address" minLength={12} placeholder="House, street, locality and postal code" required /></label>}
            <label>Order note (optional)<textarea name="notes" maxLength={500} placeholder="Colour preference or useful delivery note" /></label>
          </section>
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <label>Coupon code<div><input value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} placeholder="Optional" /><span>Validated by backend</span></div></label>
          <dl><div><dt>Items</dt><dd>{formatCurrency(itemSubtotal)}</dd></div><div><dt>{fulfilment === "delivery" ? "Local delivery" : "Pickup"}</dt><dd>Calculated by backend</dd></div><div className="total"><dt>Item subtotal</dt><dd>{formatCurrency(itemSubtotal)}</dd></div></dl>
          {message && <p className={state === "error" ? "form-error" : "cart-message"} role="status">{message}</p>}
          {state === "success" ? <Link className="cart-order-link" href={`/orders/${orderId}`}><CheckCircle2 size={17} /> Track this order</Link> : <button type="submit" disabled={state === "submitting" || state === "payment"}>{state === "submitting" ? <LoaderCircle className="spin" size={17} /> : <CreditCard size={17} />}{state === "submitting" ? "Creating secure order…" : state === "payment" ? "Payment window open" : "Continue to secure payment"}</button>}
          <Link className="cart-signin" href="/login"><LockKeyhole size={14} /> Verify or change mobile account</Link>
          <small>The payment amount comes from the server. Provider confirmation arrives through a signed webhook.</small>
        </aside>
      </form>
    </section>
  );
}
