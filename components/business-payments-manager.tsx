"use client";

import {
  BadgeIndianRupee,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  LoaderCircle,
  ReceiptIndianRupee,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";
import { formatCurrency } from "@/lib/utils";

type Payment = {
  id: string;
  provider: string;
  amount: string | number;
  currency: string;
  status: string;
  capturedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  order?: { id: string; orderNumber: string; status: string; fulfilmentType: string } | null;
  subscription?: { id: string; billingCycle: string; plan: { name: string } } | null;
  refunds: Array<{ id: string; amount: string | number; status: string; reason: string }>;
};

type Settlement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: string | number;
  commissionAmount: string | number;
  taxAmount: string | number;
  netAmount: string | number;
  status: string;
  settledAt: string | null;
};

type PaymentData = {
  payments: Payment[];
  settlements: Settlement[];
  summary: { capturedCount: number; capturedAmount: string | number };
};

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BusinessPaymentsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [data, setData] = useState<PaymentData>({ payments: [], settlements: [], summary: { capturedCount: 0, capturedAmount: 0 } });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/payments?businessId=${encodeURIComponent(businessId)}`));
      const body = await response.json() as { data?: PaymentData; message?: string | string[] };
      if (!response.ok || !body.data) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Payments could not be loaded.");
      setData(body.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const refunded = useMemo(() => data.payments.reduce((sum, payment) => sum + payment.refunds.reduce((refundSum, refund) => refundSum + Number(refund.amount), 0), 0), [data.payments]);
  const pending = data.payments.filter((payment) => ["CREATED", "AUTHORIZED"].includes(payment.status)).length;

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Revenue operations</span><h1>Payments</h1><p>Track real order and subscription transactions, refunds, captured revenue and settlement periods for this workspace.</p></div>
        <div className="business-product-heading-actions">{user.businesses.length > 1 && <label><span>Business</span><select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>}<button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Refresh</button></div>
      </section>
      {message && <p className="settings-saved" role="alert"><CheckCircle2 size={15} /> {message}</p>}
      <section className="manager-summary-grid">
        <article><BadgeIndianRupee size={20} /><div><strong>{formatCurrency(Number(data.summary.capturedAmount))}</strong><small>Captured revenue</small></div></article>
        <article><ReceiptIndianRupee size={20} /><div><strong>{data.summary.capturedCount}</strong><small>Captured payments</small></div></article>
        <article><CreditCard size={20} /><div><strong>{pending}</strong><small>Pending payments</small></div></article>
        <article><CircleDollarSign size={20} /><div><strong>{formatCurrency(refunded)}</strong><small>Refunded</small></div></article>
      </section>
      <section className="manager-table-card business-finance-section"><header><div><span className="eyebrow">Transaction ledger</span><h2>{workspace?.name ?? "Business"} payments</h2></div></header>{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading transactions</strong></div> : data.payments.length ? <div className="business-payment-records">{data.payments.map((payment) => <article key={payment.id}><span data-status={payment.status}><CreditCard size={17} /></span><div><small>{payment.order?.orderNumber ?? payment.subscription?.plan.name ?? "BNC transaction"}</small><h3>{payment.order ? `Marketplace order · ${readable(payment.order.fulfilmentType)}` : payment.subscription ? `${readable(payment.subscription.billingCycle)} subscription` : "Account payment"}</h3><p>{payment.provider} · {new Date(payment.createdAt).toLocaleString("en-IN")}</p>{payment.refunds.map((refund) => <em key={refund.id}>Refund {formatCurrency(Number(refund.amount))} · {readable(refund.status)} · {refund.reason}</em>)}</div><strong>{formatCurrency(Number(payment.amount))}</strong><b data-status={payment.status}>{readable(payment.status)}</b></article>)}</div> : <div className="admin-empty"><CreditCard size={28} /><strong>No payment records</strong><span>Captured checkout and subscription transactions will appear here.</span></div>}</section>
      <section className="manager-table-card business-finance-section"><header><div><span className="eyebrow">Payout reconciliation</span><h2>Settlements</h2></div></header>{data.settlements.length ? <div className="business-settlement-records">{data.settlements.map((settlement) => <article key={settlement.id}><div><strong>{new Date(settlement.periodStart).toLocaleDateString("en-IN")} – {new Date(settlement.periodEnd).toLocaleDateString("en-IN")}</strong><small>Gross {formatCurrency(Number(settlement.grossAmount))} · Commission {formatCurrency(Number(settlement.commissionAmount))} · Tax {formatCurrency(Number(settlement.taxAmount))}</small></div><strong>{formatCurrency(Number(settlement.netAmount))}</strong><span data-status={settlement.status}>{readable(settlement.status)}</span></article>)}</div> : <div className="admin-empty business-short-empty"><CircleDollarSign size={26} /><strong>No settlement periods yet</strong><span>Provider reconciliation records will appear after captured marketplace payouts.</span></div>}</section>
    </DashboardShell>
  );
}
