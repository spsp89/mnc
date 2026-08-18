"use client";

import { CheckCircle2, Flag, MessageSquareWarning, ShieldCheck, ShoppingBag, Star, UserCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { appPath } from "@/lib/client-routing";

type ModerationReview = {
  id: string;
  overallRating: number;
  serviceQuality: number | null;
  valueForMoney: number | null;
  responseTime: number | null;
  staffBehaviour: number | null;
  body: string;
  recommended: boolean;
  verifiedInteraction: boolean;
  status: string;
  moderationReason: string | null;
  createdAt: string;
  business: { id: string; name: string };
  customer: { customerProfile?: { displayName?: string } };
  reports: Array<{ id: string; reason: string; details?: string; status: string }>;
};

function reviewItems(payload: unknown): ModerationReview[] {
  return Array.isArray(payload) ? (payload as ModerationReview[]) : [];
}

export function AdminReviewModeration({ payload }: { payload: unknown }) {
  const initialReviews = useMemo(() => reviewItems(payload), [payload]);
  const [reviews, setReviews] = useState(initialReviews);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");

  async function moderate(review: ModerationReview, action: "PUBLISH" | "REMOVE") {
    const reason = reasons[review.id]?.trim() ?? "";
    if (reason.length < 8) {
      setMessageKind("error");
      setMessage("Add a moderation note of at least 8 characters before deciding.");
      return;
    }
    if (!window.confirm(`${action === "PUBLISH" ? "Publish" : "Remove"} this review for ${review.business.name}?`)) return;
    setBusyId(review.id);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/reviews/${review.id}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Review moderation failed.");
      }
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setMessageKind("success");
      setMessage(action === "PUBLISH" ? `Review for ${review.business.name} approved and published.` : `Review for ${review.business.name} rejected and removed.`);
    } catch (error) {
      setMessageKind("error");
      setMessage(error instanceof Error ? error.message : "Review moderation failed.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="admin-review-workspace">
      {message && <p className={messageKind === "error" ? "form-error" : "settings-saved"} role={messageKind === "error" ? "alert" : "status"}>{messageKind === "error" ? <XCircle size={16} /> : <CheckCircle2 size={16} />} {message}</p>}
      <div className="admin-review-integrity-card">
        <div><span><ShieldCheck size={22} /></span><div><small>Launch-period trust</small><h2>Collect genuine verified-purchase reviews</h2><p>Completed buyers can review from their order page. BNC never invents a customer, rating, purchase, or claim of happiness.</p></div></div>
        <ul>
          <li><ShoppingBag size={16} /><span><strong>Purchase evidence</strong> One review per completed order</span></li>
          <li><UserCheck size={16} /><span><strong>Customer-owned words</strong> The buyer chooses the rating and text</span></li>
          <li><CheckCircle2 size={16} /><span><strong>Integrity queue</strong> Every submission still requires moderation</span></li>
        </ul>
      </div>
      <div className="admin-stat-grid admin-stat-grid-compact">
        <article><span><MessageSquareWarning size={20} /></span><div><small>Awaiting decision</small><strong>{reviews.length}</strong></div></article>
        <article><span><Flag size={20} /></span><div><small>Reported reviews</small><strong>{reviews.filter((review) => review.reports.length > 0).length}</strong></div></article>
      </div>
      <div className="admin-moderation-list">
        {reviews.map((review) => (
          <article key={review.id}>
            <header>
              <div>
                <div className="admin-record-meta">
                  <span className={`admin-status admin-status-${review.status.toLowerCase()}`}>{review.status}</span>
                  <span className="admin-rating"><Star size={14} fill="currentColor" /> {review.overallRating}/5</span>
                  {review.verifiedInteraction && <span>Verified interaction</span>}
                </div>
                <h2>{review.business.name}</h2>
                <p>By {review.customer.customerProfile?.displayName || "BNC customer"} · {new Date(review.createdAt).toLocaleString("en-IN")}</p>
              </div>
            </header>
            <blockquote>{review.body}</blockquote>
            <div className="admin-rating-breakdown">
              <span>Service <strong>{review.serviceQuality ?? "—"}</strong></span>
              <span>Value <strong>{review.valueForMoney ?? "—"}</strong></span>
              <span>Response <strong>{review.responseTime ?? "—"}</strong></span>
              <span>Staff <strong>{review.staffBehaviour ?? "—"}</strong></span>
            </div>
            {review.reports.map((report) => (
              <div className="admin-report-note" key={report.id}>
                <Flag size={16} />
                <div><strong>{report.reason.replaceAll("_", " ")}</strong><p>{report.details || "No reporter detail supplied."}</p></div>
              </div>
            ))}
            {review.moderationReason && <p className="admin-existing-note">Previous note: {review.moderationReason}</p>}
            <label className="admin-decision-note">
              Moderation note
              <textarea value={reasons[review.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [review.id]: event.target.value }))} minLength={8} maxLength={1000} rows={3} placeholder="Record why this review should be published or removed" />
            </label>
            <footer>
              <button type="button" className="admin-danger-button" disabled={busyId === review.id} onClick={() => void moderate(review, "REMOVE")}><XCircle size={16} /> Reject &amp; remove</button>
              <button type="button" className="admin-primary-button" disabled={busyId === review.id} onClick={() => void moderate(review, "PUBLISH")}><CheckCircle2 size={16} /> Approve &amp; publish</button>
            </footer>
          </article>
        ))}
        {!reviews.length && <div className="admin-empty"><CheckCircle2 size={31} /><strong>Review queue is clear</strong><span>New pending and flagged reviews will appear here.</span></div>}
      </div>
    </section>
  );
}
