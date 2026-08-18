"use client";

import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareReply,
  Send,
  ShieldCheck,
  Star,
  ThumbsUp,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type Review = {
  id: string;
  overallRating: number;
  serviceQuality: number | null;
  valueForMoney: number | null;
  responseTime: number | null;
  staffBehaviour: number | null;
  body: string;
  recommended: boolean;
  verifiedInteraction: boolean;
  helpfulCount: number;
  createdAt: string;
  customer: { customerProfile?: { displayName?: string | null; avatarUrl?: string | null } | null };
  reply: { body: string; createdAt: string; updatedAt: string } | null;
};

function Stars({ value }: { value: number }) {
  return <span className="business-review-stars" aria-label={`${value} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star size={15} fill={index < value ? "currentColor" : "none"} key={index} />)}</span>;
}

export function BusinessReviewsManager({ user }: { user: BncSessionUser }) {
  const [businessId, setBusinessId] = useState(user.businesses[0]?.id ?? "");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const workspace = user.businesses.find((item) => item.id === businessId);
  const canReply = workspace?.capabilities.includes("business:profile:manage") ?? false;

  const load = useCallback(async () => {
    if (!businessId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/reviews?businessId=${encodeURIComponent(businessId)}`));
      const body = await response.json() as { data?: Review[]; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Reviews could not be loaded.");
      setReviews(body.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reviews could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const summary = useMemo(() => {
    const average = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.overallRating), 0) / reviews.length : 0;
    return {
      average,
      verified: reviews.filter((review) => review.verifiedInteraction).length,
      replies: reviews.filter((review) => review.reply).length,
    };
  }, [reviews]);

  function openReply(review: Review) {
    setReplyingId(review.id);
    setReplyBody(review.reply?.body ?? "");
    setMessage("");
  }

  async function saveReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!replyingId) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/business/reviews/${replyingId}/reply`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Reply could not be saved.");
      setReplyingId(null);
      setReplyBody("");
      setMessage("Your public business reply has been saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reply could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">Customer trust</span><h1>Reviews</h1><p>Read published customer feedback and respond publicly from the authorised business workspace.</p></div>
        {user.businesses.length > 1 && <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} aria-label="Business workspace">{user.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select>}
      </section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={15} /> {message}</p>}
      <section className="manager-summary-grid business-compact-summary">
        <article><Star size={20} /><div><strong>{summary.average.toFixed(1)}</strong><small>Average rating</small></div></article>
        <article><ShieldCheck size={20} /><div><strong>{summary.verified}</strong><small>Verified interactions</small></div></article>
        <article><MessageSquareReply size={20} /><div><strong>{summary.replies}/{reviews.length}</strong><small>Business replies</small></div></article>
      </section>
      <section className="manager-table-card">
        {loading ? <div className="admin-empty"><LoaderCircle className="spin" size={28} /><strong>Loading reviews</strong></div> : reviews.length ? <div className="business-review-records">{reviews.map((review) => <article key={review.id}>
          <header><div className="business-review-avatar">{(review.customer.customerProfile?.displayName ?? "BNC").slice(0, 2).toUpperCase()}</div><div><strong>{review.customer.customerProfile?.displayName ?? "BNC customer"}</strong><small>{new Date(review.createdAt).toLocaleDateString("en-IN")}{review.verifiedInteraction ? " · Verified interaction" : ""}</small></div><Stars value={Number(review.overallRating)} /></header>
          <p>{review.body}</p>
          <footer><span><ThumbsUp size={13} /> Helpful to {review.helpfulCount}</span>{review.recommended && <span><CheckCircle2 size={13} /> Recommends this business</span>}</footer>
          {review.reply && <blockquote><strong>Business response</strong><p>{review.reply.body}</p></blockquote>}
          {canReply && <button type="button" onClick={() => openReply(review)}><MessageSquareReply size={14} /> {review.reply ? "Edit reply" : "Reply"}</button>}
          {replyingId === review.id && <form className="business-review-reply" onSubmit={saveReply}><label>Public response<textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} minLength={2} maxLength={2000} rows={4} required /></label><div><button type="button" onClick={() => setReplyingId(null)}>Cancel</button><button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={14} /> : <Send size={14} />} Save reply</button></div></form>}
        </article>)}</div> : <div className="admin-empty"><Star size={28} /><strong>No published reviews yet</strong><span>Reviews appear here after BNC integrity checks.</span></div>}
      </section>
    </DashboardShell>
  );
}
