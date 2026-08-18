"use client";

import { BadgeIndianRupee, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, LoaderCircle, Plus, RefreshCcw, Search, ShieldAlert, Undo2, X, Zap } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type PaymentRecord = {
  id: string;
  orderId: string | null;
  subscriptionId: string | null;
  provider: string;
  providerPaymentId: string | null;
  amount: string | number;
  currency: string;
  status: string;
  capturedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  metadata?: { orderNumber?: string };
};

type RefundRecord = {
  id: string;
  orderId: string | null;
  paymentId: string;
  amount: string | number;
  reason: string;
  status: string;
  providerRefundId: string | null;
  requestedAt: string;
  completedAt: string | null;
  source?: string;
  method?: string | null;
  externalReference?: string | null;
  failureReason?: string | null;
  order?: { orderNumber: string } | null;
  payment?: { provider: string; providerPaymentId: string | null; currency: string; subscription?: { business: { name: string }; plan: { name: string } } | null };
};

type SubscriptionOption = {
  id: string;
  status: string;
  business: { name: string };
  plan: { name: string };
};

type RefundablePayment = {
  id: string;
  provider: string;
  providerPaymentId: string | null;
  currency: string;
  amount: number;
  refundableAmount: number;
  capturedAt: string | null;
  automaticAvailable: boolean;
  order: { orderNumber: string } | null;
  subscription: { business: { name: string }; plan: { name: string } } | null;
};

const localDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

function amount(value: string | number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AdminFinanceView({ section, payload }: { section: "payments" | "refunds"; payload: unknown }) {
  const initialItems = useMemo(() => Array.isArray(payload) ? payload : [], [payload]);
  const [items, setItems] = useState<unknown[]>(initialItems);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: initialItems.length });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [subscriptionOptions, setSubscriptionOptions] = useState<SubscriptionOption[]>([]);
  const [refundMode, setRefundMode] = useState<"manual" | "automatic" | null>(null);
  const [refundablePayments, setRefundablePayments] = useState<RefundablePayment[]>([]);
  const [selectedRefundPayment, setSelectedRefundPayment] = useState("");
  const loadRecords = useCallback(async () => {
    setLoading(true); setNotice(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (submittedQuery) params.set("q", submittedQuery);
      if (status !== "ALL") params.set("status", status);
      const response = await fetch(`/api/admin/${section}?${params}`);
      const body = await response.json() as { data?: unknown[]; meta?: { page: number; pageSize: number; total: number }; message?: string | string[] };
      if (!response.ok || !body.data || !body.meta) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Finance records could not be loaded.");
      setItems(body.data); setMeta(body.meta);
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Finance records could not be loaded." }); }
    finally { setLoading(false); }
  }, [page, section, status, submittedQuery]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecords(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);
  const search = (event: FormEvent) => { event.preventDefault(); setPage(1); setSubmittedQuery(query.trim()); };
  const managePayment = async (payment: PaymentRecord, action: "MARK_FAILED" | "CANCEL") => {
    const reason = window.prompt(`Reason to ${action === "CANCEL" ? "cancel" : "mark failed"} this unsettled payment (minimum 8 characters):`)?.trim();
    if (!reason) return;
    if (reason.length < 8) { setNotice({ kind: "error", text: "Payment audit reason must be at least 8 characters." }); return; }
    if (!window.confirm(`Confirm ${action === "CANCEL" ? "cancellation" : "failure"} for payment ${payment.id}? This cannot mark a payment paid.`)) return;
    const response = await fetch(`/api/admin/payments/${encodeURIComponent(payment.id)}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, reason }) });
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    if (!response.ok) { setNotice({ kind: "error", text: Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Payment status could not be updated." }); return; }
    setNotice({ kind: "success", text: "Payment status and audit history updated." });
    await loadRecords();
  };
  const openManualPayment = async () => {
    setManualOpen(true); setManualBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/admin/subscriptions?page=1&pageSize=100");
      const body = await response.json() as { data?: SubscriptionOption[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Subscriptions could not be loaded.");
      setSubscriptionOptions(body.data ?? []);
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Subscriptions could not be loaded." }); setManualOpen(false); }
    finally { setManualBusy(false); }
  };
  const recordManualPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setManualBusy(true); setNotice(null);
    try {
      const receivedAt = new Date(String(data.get("receivedAt")));
      if (Number.isNaN(receivedAt.getTime())) throw new Error("Enter a valid received date and time.");
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subscriptionId: data.get("subscriptionId"), amount: Number(data.get("amount")), method: data.get("method"),
          reference: data.get("reference"), receivedAt: receivedAt.toISOString(), evidence: data.get("evidence"),
          confirmedReceived: data.get("confirmedReceived") === "on", reason: data.get("reason"),
        }),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Manual payment could not be recorded.");
      setManualOpen(false); setPage(1); setSubmittedQuery(""); setQuery(""); setStatus("ALL");
      setNotice({ kind: "success", text: "Manual payment recorded with status history and an immutable audit entry." });
      await loadRecords();
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Manual payment could not be recorded." }); }
    finally { setManualBusy(false); }
  };
  const openRefund = async (mode: "manual" | "automatic") => {
    setRefundMode(mode); setManualBusy(true); setNotice(null); setSelectedRefundPayment("");
    try {
      const response = await fetch("/api/admin/refunds/options");
      const body = await response.json() as { data?: RefundablePayment[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Refundable payments could not be loaded.");
      setRefundablePayments((body.data ?? []).filter((payment) => mode === "manual" || payment.automaticAvailable));
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Refundable payments could not be loaded." }); setRefundMode(null); }
    finally { setManualBusy(false); }
  };
  const submitRefund = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!refundMode) return;
    const data = new FormData(event.currentTarget);
    setManualBusy(true); setNotice(null);
    try {
      const payload = refundMode === "manual" ? {
        paymentId: data.get("paymentId"), amount: Number(data.get("amount")), method: data.get("method"), reference: data.get("reference"),
        completedAt: new Date(String(data.get("completedAt"))).toISOString(), evidence: data.get("evidence"),
        confirmedReturned: data.get("confirmedReturned") === "on", reason: data.get("reason"), auditReason: data.get("auditReason"),
      } : { paymentId: data.get("paymentId"), amount: Number(data.get("amount")), reason: data.get("reason"), auditReason: data.get("auditReason") };
      const response = await fetch(`/api/admin/refunds/${refundMode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Refund could not be recorded.");
      setRefundMode(null); setPage(1); setSubmittedQuery(""); setQuery(""); setStatus("ALL");
      setNotice({ kind: "success", text: refundMode === "manual" ? "Manual refund completed with payment history and audit evidence." : "Automatic refund accepted by Razorpay and awaiting signed provider confirmation." });
      await loadRecords();
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Refund could not be recorded." }); }
    finally { setManualBusy(false); }
  };
  const statuses = section === "payments"
    ? ["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"]
    : ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"];
  const filtered = items;
  const total = items.reduce<number>((sum, item) => sum + amount((item as { amount: string | number }).amount), 0);
  const completed = items.filter((item) => ["CAPTURED", "COMPLETED", "REFUNDED"].includes((item as { status: string }).status)).length;

  return (
    <section className="admin-finance-workspace">
      <div className="admin-stat-grid admin-stat-grid-compact">
        <article><span><BadgeIndianRupee size={20} /></span><div><small>{section === "payments" ? "Page payment value" : "Refund value"}</small><strong>{formatCurrency(total)}</strong></div></article>
        <article><span><CreditCard size={20} /></span><div><small>Records</small><strong>{items.length}</strong></div></article>
        <article><span><RefreshCcw size={20} /></span><div><small>Completed</small><strong>{completed}</strong></div></article>
      </div>
      {section === "payments" && <div className="admin-finance-create-bar"><div><strong>Offline receipts</strong><span>Record only funds already verified outside the payment gateway.</span></div><button type="button" onClick={() => void openManualPayment()}><Plus size={16} /> Enter manual payment</button></div>}
      {section === "refunds" && <div className="admin-finance-create-bar admin-refund-create-bar"><div><strong>Refund operations</strong><span>Record a verified offline return or initiate a provider refund that completes only after a signed webhook.</span></div><div><button type="button" className="secondary" onClick={() => void openRefund("manual")}><Undo2 size={16} /> Enter manual refund</button><button type="button" onClick={() => void openRefund("automatic")}><Zap size={16} /> Automatic refund</button></div></div>}
      <div className="admin-operations-card">
        {notice && <p className={notice.kind === "error" ? "form-error" : "settings-saved"} role={notice.kind === "error" ? "alert" : "status"}>{notice.kind === "error" ? <ShieldAlert size={15}/> : <CheckCircle2 size={15}/>} {notice.text}</p>}
        <form className="admin-operation-tools" onSubmit={search}>
          <label><Search size={17} /><span className="sr-only">Search finance records</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section}, order, or provider ID`} /></label>
          <label className="admin-filter-field"><span>Status</span><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="ALL">All statuses</option>{statuses.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
          <button type="submit">Search</button>
        </form>
        <div className="admin-finance-table" role="table" aria-label={section === "payments" ? "Payment ledger" : "Refund ledger"}>
          <div className="admin-finance-row admin-finance-header" role="row">
            <span>{section === "payments" ? "Transaction" : "Refund"}</span><span>Status</span><span>Date</span><span>Amount</span>
          </div>
          {loading ? <div className="admin-empty"><LoaderCircle className="spin"/><strong>Loading {section} ledger</strong></div> : section === "payments"
            ? (filtered as PaymentRecord[]).map((payment) => (
                <div className="admin-finance-row" role="row" key={payment.id}>
                  <div><strong>{payment.metadata?.orderNumber || payment.providerPaymentId || payment.id}</strong><small>{payment.provider} · {payment.orderId || payment.subscriptionId || "No linked order"}</small></div>
                  <span className={`admin-status admin-status-${payment.status.toLowerCase()}`}>{payment.status.replaceAll("_", " ")}</span>
                  <span>{new Date(payment.capturedAt || payment.failedAt || payment.createdAt).toLocaleString("en-IN")}</span>
                  <div><strong>{formatCurrency(amount(payment.amount))}</strong>{["CREATED", "AUTHORIZED"].includes(payment.status) && <span className="admin-finance-actions"><button type="button" onClick={() => void managePayment(payment, "MARK_FAILED")}>Mark failed</button><button type="button" onClick={() => void managePayment(payment, "CANCEL")}>Cancel</button></span>}</div>
                </div>
              ))
            : (filtered as RefundRecord[]).map((refund) => (
                <div className="admin-finance-row" role="row" key={refund.id}>
                  <div><strong>{refund.externalReference || refund.providerRefundId || refund.id}</strong><small>{refund.source || "PROVIDER"} · {refund.order?.orderNumber ? `Order ${refund.order.orderNumber}` : refund.payment?.subscription ? `${refund.payment.subscription.business.name} · ${refund.payment.subscription.plan.name}` : `Payment ${refund.paymentId}`} · {refund.reason}</small>{refund.failureReason && <small className="form-error">{refund.failureReason}</small>}</div>
                  <span className={`admin-status admin-status-${refund.status.toLowerCase()}`}>{refund.status.replaceAll("_", " ")}</span>
                  <span>{new Date(refund.completedAt || refund.requestedAt).toLocaleString("en-IN")}</span>
                  <strong>{formatCurrency(amount(refund.amount))}</strong>
                </div>
              ))}
          {!loading && !filtered.length && <div className="admin-empty"><CreditCard size={30} /><strong>No finance records match</strong><span>Try another search or status.</span></div>}
        </div>
        <footer><span>Showing {filtered.length} of {meta.total}</span><div><button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={14}/> Previous</button><button type="button" disabled={loading || page * meta.pageSize >= meta.total} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={14}/></button></div></footer>
      </div>
      {manualOpen && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="manual-payment-title"><header><div><small>Audited offline receipt</small><h2 id="manual-payment-title">Enter manual payment</h2></div><button type="button" onClick={() => setManualOpen(false)} aria-label="Close manual payment form"><X size={18} /></button></header><form onSubmit={recordManualPayment}>
        <label>Merchant and subscription<select name="subscriptionId" required disabled={manualBusy}><option value="">Select a merchant and plan</option>{subscriptionOptions.map((subscription) => <option value={subscription.id} key={subscription.id}>{subscription.business.name} · {subscription.plan.name} · {subscription.status.replaceAll("_", " ")}</option>)}</select></label>
        {!manualBusy && !subscriptionOptions.length && <p className="admin-action-warning">No subscriptions are available. Assign a subscription before recording its payment.</p>}
        <div className="admin-manual-payment-grid"><label>Amount (₹)<input name="amount" type="number" min="0.01" max="999999999.99" step="0.01" required /></label><label>Payment method<select name="method" required><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="OTHER">Other</option></select></label></div>
        <label>Receipt / transaction reference<input name="reference" minLength={3} maxLength={120} required placeholder="Bank UTR, UPI reference, or receipt number" /></label>
        <label>Funds received at<input name="receivedAt" type="datetime-local" max={localDateTime()} defaultValue={localDateTime()} required /></label>
        <label>Evidence / reconciliation details<textarea name="evidence" minLength={8} maxLength={1000} rows={3} required placeholder="Bank statement entry, cash receipt, cheque, or reconciliation evidence" /></label>
        <label>Audit reason<textarea name="reason" minLength={8} maxLength={1000} rows={3} required placeholder="Why this offline payment is being entered" /></label>
        <label className="admin-manual-confirm"><input name="confirmedReceived" type="checkbox" required /><span>I verified that these funds were received. This will create a captured payment record.</span></label>
        <p className="admin-safety-note"><ShieldAlert size={15} /> This records an offline receipt only. It does not impersonate a gateway webhook or automatically change subscription dates.</p>
        <footer><button type="button" className="secondary" onClick={() => setManualOpen(false)}>Cancel</button><button type="submit" disabled={manualBusy || !subscriptionOptions.length}>{manualBusy ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} Record payment</button></footer>
      </form></section></div>}
      {refundMode && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="refund-title"><header><div><small>{refundMode === "manual" ? "Audited offline return" : "Provider initiated return"}</small><h2 id="refund-title">{refundMode === "manual" ? "Enter manual refund" : "Start automatic refund"}</h2></div><button type="button" onClick={() => setRefundMode(null)} aria-label="Close refund form"><X size={18} /></button></header><form onSubmit={submitRefund}>
        <label>Eligible payment<select name="paymentId" required disabled={manualBusy} value={selectedRefundPayment} onChange={(event) => setSelectedRefundPayment(event.target.value)}><option value="">Select a captured payment</option>{refundablePayments.map((payment) => <option value={payment.id} key={payment.id}>{payment.order?.orderNumber ? `Order ${payment.order.orderNumber}` : payment.subscription ? `${payment.subscription.business.name} · ${payment.subscription.plan.name}` : payment.id} · {payment.provider} · {formatCurrency(payment.refundableAmount)} available</option>)}</select></label>
        {!manualBusy && !refundablePayments.length && <p className="admin-action-warning">No eligible {refundMode === "automatic" ? "Razorpay " : ""}payments have a refundable balance.</p>}
        <label>Refund amount (₹)<input name="amount" type="number" min="0.01" max={refundablePayments.find((payment) => payment.id === selectedRefundPayment)?.refundableAmount ?? 999999999.99} step="0.01" required /></label>
        {refundMode === "manual" && <><div className="admin-manual-payment-grid"><label>Return method<select name="method" required><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="OTHER">Other</option></select></label><label>Refunded at<input name="completedAt" type="datetime-local" max={localDateTime()} defaultValue={localDateTime()} required /></label></div><label>Refund / transaction reference<input name="reference" minLength={3} maxLength={120} required placeholder="Bank UTR, UPI reference, or receipt number" /></label><label>Evidence / reconciliation details<textarea name="evidence" minLength={8} maxLength={1000} rows={3} required placeholder="Bank statement entry, cash receipt, cheque, or reconciliation evidence" /></label></>}
        <label>Refund reason<textarea name="reason" minLength={8} maxLength={1000} rows={3} required placeholder="Why this refund is being issued" /></label>
        <label>Audit reason<textarea name="auditReason" minLength={8} maxLength={1000} rows={3} required placeholder="Why the administrator is authorising this refund operation" /></label>
        {refundMode === "manual" ? <label className="admin-manual-confirm"><input name="confirmedReturned" type="checkbox" required /><span>I verified that these funds were returned. This will complete the refund immediately.</span></label> : <p className="admin-safety-note"><ShieldAlert size={15} /> The request is sent by the server. It remains processing until a signed Razorpay webhook confirms completion.</p>}
        <footer><button type="button" className="secondary" onClick={() => setRefundMode(null)}>Cancel</button><button type="submit" disabled={manualBusy || !refundablePayments.length || !selectedRefundPayment}>{manualBusy ? <LoaderCircle className="spin" size={15} /> : refundMode === "manual" ? <Undo2 size={15} /> : <Zap size={15} />} {refundMode === "manual" ? "Record refund" : "Request refund"}</button></footer>
      </form></section></div>}
    </section>
  );
}
