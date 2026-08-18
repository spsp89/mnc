"use client";

import {
  BadgeCheck,
  Check,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  slug: string;
  starLevel: number;
  monthlyPrice: string | number;
  annualPrice: string | number;
  leadQuota: number | null;
  offerLimit: number | null;
  productLimit: number | null;
  mediaLimit: number | null;
  categoryLimit: number;
  listingReach: "NEARBY_5KM" | "CONSTITUENCY" | "DISTRICT" | "STATE";
  descriptionEnabled: boolean;
  socialLinksEnabled: boolean;
  bookingEnabled: boolean;
  deliveryEnabled: boolean;
  automaticLeadAlerts: boolean;
  locationLimit: number;
  teamMemberLimit: number;
  sponsoredPlacement: boolean;
  advancedAnalytics: boolean;
  features: unknown;
};

type Subscription = {
  id: string;
  status: string;
  billingCycle: "monthly" | "annual";
  startsAt: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  autoRenew: boolean;
  renewalStatus: string;
  lastRenewedAt: string | null;
  source: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "cancelled" | "not_applicable";
  leadCreditsUsed: number;
  usage: Record<string, { used: number; limit: number | null }>;
  plan: Plan;
  payments: Array<{ id: string; amount: string | number; status: string; createdAt: string }>;
};

type RazorpayCheckout = { open(): void };

async function loadRazorpay() {
  const razorpayWindow = window as typeof window & { Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout };
  if (razorpayWindow.Razorpay) return razorpayWindow.Razorpay;
  const ready = await new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return ready ? razorpayWindow.Razorpay : undefined;
}

function planFeatures(plan: Plan) {
  const supplied = Array.isArray(plan.features) ? plan.features.filter((item): item is string => typeof item === "string") : [];
  return supplied.length ? supplied : [
    `${plan.productLimit ?? "Unlimited"} catalogue products`,
    `${plan.offerLimit ?? "Unlimited"} offers`,
    `${plan.mediaLimit ?? "Unlimited"} gallery photos`,
    `${plan.categoryLimit} business categories`,
    `${plan.leadQuota ?? "Unlimited"} lead credits per cycle`,
    `${plan.teamMemberLimit} team members`,
    `${plan.locationLimit} business locations`,
    plan.advancedAnalytics ? "Advanced analytics" : "Core performance reporting",
  ];
}

export function BusinessSubscriptionManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId);
  const canManage = workspace?.capabilities.includes("business:billing:manage") ?? false;
  const current = subscriptions.find((subscription) => ["ACTIVE", "TRIAL", "GRACE_PERIOD", "PAST_DUE"].includes(subscription.status)) ?? subscriptions[0];
  const pendingCheckout = subscriptions.find((subscription) => subscription.status === "PENDING_PAYMENT");

  const load = useCallback(async () => {
    if (!businessId) {
      setSubscriptions([]);
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/subscriptions?businessId=${encodeURIComponent(businessId)}`));
      const body = await response.json() as { data?: { subscriptions?: Subscription[]; plans?: Plan[] }; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Subscription details could not be loaded.");
      setSubscriptions(body.data?.subscriptions ?? []);
      setPlans(body.data?.plans ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Subscription details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function beginCheckout(subscriptionId: string) {
    const response = await fetch(appPath("/api/payments/checkout"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subscriptionId,
        idempotencyKey: `business-subscription-${subscriptionId}-${crypto.randomUUID()}`,
      }),
    });
    const body = await response.json() as {
      data?: { keyId: string; providerOrderId: string; amountSubunits: number; currency: string };
      message?: string | string[];
    };
    if (!response.ok || !body.data?.providerOrderId) {
      throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Payment checkout could not be prepared.");
    }
    const Razorpay = await loadRazorpay();
    if (!Razorpay) throw new Error("The secure payment window could not load.");
    const payment = new Razorpay({
      key: body.data.keyId,
      order_id: body.data.providerOrderId,
      amount: body.data.amountSubunits,
      currency: body.data.currency,
      name: "BNC",
      description: "Business subscription",
      prefill: { email: user.email ?? undefined, contact: user.phone ?? undefined },
      handler: () => {
        setMessage("Payment submitted. The plan will activate after signed provider confirmation.");
        void load();
      },
      modal: { ondismiss: () => setMessage("Payment was not completed. The pending checkout remains available.") },
      theme: { color: "#0f48d8" },
    });
    payment.open();
  }

  async function choosePlan(plan: Plan) {
    if (!workspace || !canManage) return;
    setBusyId(plan.id);
    setMessage("");
    try {
      const response = await fetch(appPath("/api/business/subscriptions"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId: workspace.id, planId: plan.id, billingCycle }),
      });
      const body = await response.json() as { data?: Subscription; checkoutRequired?: boolean; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "The plan could not be selected.");
      if (body.checkoutRequired) await beginCheckout(body.data.id);
      else {
        setMessage(`${plan.name} is now active for ${workspace.name}.`);
        await load();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The plan could not be selected.");
    } finally {
      setBusyId("");
    }
  }

  async function cancel(subscription: Subscription) {
    if (!window.confirm(subscription.status === "PENDING_PAYMENT" ? "Cancel this pending checkout?" : "Cancel automatic renewal? Current access continues until expiry.")) return;
    setBusyId(subscription.id);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/subscriptions/${subscription.id}/cancel`), { method: "POST" });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Renewal could not be cancelled.");
      setMessage(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Subscription renewal cancelled.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Renewal could not be cancelled.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Growth plan</span><h1>Subscription</h1><p>See the live plan, usage limits, renewal date, payment state and available upgrades for this workspace.</p></div>
        <div className="business-product-heading-actions">{user.businesses.length > 1 && <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>}<div className="business-billing-cycle" role="group" aria-label="Billing cycle"><button className={billingCycle === "monthly" ? "active" : ""} type="button" onClick={() => setBillingCycle("monthly")}>Monthly</button><button className={billingCycle === "annual" ? "active" : ""} type="button" onClick={() => setBillingCycle("annual")}>Annual</button></div></div>
      </section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {message}</p>}
      {loading ? <section className="manager-table-card"><div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading subscription</strong></div></section> : <>
        {pendingCheckout && pendingCheckout.id !== current?.id && <section className="subscription-pending-checkout"><CreditCard size={20} /><div><strong>{pendingCheckout.plan.name} checkout is pending</strong><span>Payment: {pendingCheckout.paymentStatus.replaceAll("_", " ")} · Access changes only after signed provider confirmation.</span></div><button type="button" onClick={() => void beginCheckout(pendingCheckout.id)}>Complete payment</button></section>}
        {current && <section className="business-current-plan"><div><span><BadgeCheck size={22} /></span><div><small>Current plan · {current.status.replaceAll("_", " ")}</small><h2>{current.plan.name}</h2><p>{current.billingCycle} billing · Activated {new Date(current.startsAt).toLocaleDateString("en-IN")} · Access through {new Date(current.currentPeriodEnd).toLocaleDateString("en-IN")}</p><p>Renewal: {current.renewalStatus.replaceAll("_", " ")} · Payment: {current.paymentStatus.replaceAll("_", " ")}</p></div></div><dl><div><dt>Lead usage</dt><dd>{current.usage?.leads?.used ?? current.leadCreditsUsed} / {current.usage?.leads?.limit ?? "Unlimited"}</dd></div><div><dt>Products</dt><dd>{current.usage?.products?.used ?? 0} / {current.usage?.products?.limit ?? "Unlimited"}</dd></div><div><dt>Gallery photos</dt><dd>{current.usage?.media?.used ?? 0} / {current.usage?.media?.limit ?? "Unlimited"}</dd></div><div><dt>Offers</dt><dd>{current.usage?.offers?.used ?? 0} / {current.usage?.offers?.limit ?? "Unlimited"}</dd></div><div><dt>Categories</dt><dd>{current.usage?.categories?.used ?? 0} / {current.usage?.categories?.limit ?? "Unlimited"}</dd></div><div><dt>Listing reach</dt><dd>{current.plan.listingReach.replaceAll("_", " ")}</dd></div></dl><div>{current.status === "PENDING_PAYMENT" && <button type="button" onClick={() => void beginCheckout(current.id)} disabled={Boolean(busyId)}><CreditCard size={15} /> Complete payment</button>}{["ACTIVE", "TRIAL", "GRACE_PERIOD"].includes(current.status) && !pendingCheckout && <button type="button" onClick={() => void choosePlan(current.plan)} disabled={!canManage || Boolean(busyId)}><CreditCard size={15} /> Renew current plan</button>}{(current.autoRenew || current.status === "PENDING_PAYMENT") && <button type="button" className="secondary" onClick={() => void cancel(current)} disabled={Boolean(busyId)}><XCircle size={15} /> Cancel renewal</button>}</div></section>}
        <section className="business-plan-grid">{plans.map((plan) => { const price = Number(billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice); const selected = current?.plan.id === plan.id; return <article className={selected ? "selected" : ""} key={plan.id}><header><div><span>{plan.starLevel} BNC stars</span><h2>{plan.name}</h2></div>{plan.sponsoredPlacement && <Sparkles size={20} />}</header><p><strong>{formatCurrency(price)}</strong><small>/{billingCycle === "annual" ? "year" : "month"}</small></p><ul>{planFeatures(plan).map((feature) => <li key={feature}><Check size={14} /> {feature}</li>)}</ul><button type="button" onClick={() => void choosePlan(plan)} disabled={!canManage || selected || Boolean(busyId)}>{busyId === plan.id ? <LoaderCircle className="spin" size={15} /> : <CreditCard size={15} />} {selected ? "Current plan" : "Choose plan"}</button></article>; })}</section>
      </>}
    </DashboardShell>
  );
}
