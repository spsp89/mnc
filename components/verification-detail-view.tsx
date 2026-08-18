"use client";

import { ArrowLeft, Building2, CheckCircle2, FileCheck2, MapPin, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { appPath } from "@/lib/client-routing";

type VerificationRequest = {
  id: string;
  status: string;
  documentType: string;
  documentKey: string;
  documentHash: string;
  notes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
    legalName?: string | null;
    status: string;
    verified: boolean;
    email?: string | null;
    publicPhone?: string | null;
    websiteUrl?: string | null;
    owner?: { legalName?: string | null };
    locations?: Array<{
      id: string;
      label: string;
      addressLine1: string;
      addressLine2?: string | null;
      locality: string;
      city: string;
      district?: string | null;
      state: string;
      postalCode: string;
      isPrimary: boolean;
    }>;
  };
  reviewer?: { email?: string | null; role?: string } | null;
};

const actionable = new Set(["PENDING", "IN_REVIEW", "MORE_INFORMATION"]);

export function VerificationDetailView({ user, request: initialRequest }: { user: BncSessionUser; request: unknown }) {
  const [request, setRequest] = useState(initialRequest as VerificationRequest);
  const [notes, setNotes] = useState(request.notes ?? "");
  const [rejectionReason, setRejectionReason] = useState(request.rejectionReason ?? "");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const primaryLocation = request.business.locations?.find((location) => location.isPrimary) ?? request.business.locations?.[0];
  const canDecide = actionable.has(request.status);

  async function decide(status: "APPROVED" | "MORE_INFORMATION" | "REJECTED") {
    if (notes.trim().length < 12) {
      setMessage("Add reviewer notes of at least 12 characters.");
      return;
    }
    if (status === "REJECTED" && rejectionReason.trim().length < 8) {
      setMessage("Add a clear rejection reason of at least 8 characters.");
      return;
    }
    const confirmed = window.confirm(
      status === "APPROVED"
        ? `Approve verification for ${request.business.name}?`
        : status === "REJECTED"
          ? `Reject verification for ${request.business.name}?`
          : `Request more information from ${request.business.name}?`,
    );
    if (!confirmed) return;
    setBusy(status);
    setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/verification/${request.id}`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, notes: notes.trim(), rejectionReason: status === "REJECTED" ? rejectionReason.trim() : undefined }),
      });
      const body = (await response.json()) as { data?: { request?: VerificationRequest }; message?: string | string[] };
      if (!response.ok || !body.data?.request) {
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Verification decision failed.");
      }
      setRequest((current) => ({ ...current, ...body.data?.request }));
      setMessage(status === "APPROVED" ? "Business verification approved." : status === "REJECTED" ? "Verification rejected and the business was notified." : "More information requested from the business.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification decision failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell mode="admin" user={user}>
      <Link className="back-link" href="/admin/verification"><ArrowLeft size={15} /> Verification queue</Link>
      <section className="manager-heading admin-section-heading verification-detail-heading">
        <div><span className="eyebrow">Request {request.id}</span><h1>{request.business.name}</h1><p>Review the submitted business identity, location, and immutable document fingerprint before recording a decision.</p></div>
        <span className={`admin-status admin-status-${request.status.toLowerCase()}`}>{request.status.replaceAll("_", " ")}</span>
      </section>
      {message && <p className="settings-saved" role="status"><CheckCircle2 size={16} /> {message}</p>}
      <div className="admin-verification-layout">
        <div className="admin-verification-evidence">
          <section>
            <header><Building2 size={20} /><div><small>Business identity</small><h2>{request.business.legalName || request.business.name}</h2></div></header>
            <dl>
              <div><dt>Public name</dt><dd>{request.business.name}</dd></div>
              <div><dt>Legal owner</dt><dd>{request.business.owner?.legalName || "Not supplied"}</dd></div>
              <div><dt>Business state</dt><dd>{request.business.status.replaceAll("_", " ")}</dd></div>
              <div><dt>Current verification</dt><dd>{request.business.verified ? "Verified" : "Not verified"}</dd></div>
              <div><dt>Email</dt><dd>{request.business.email || "Not supplied"}</dd></div>
              <div><dt>Public phone</dt><dd>{request.business.publicPhone || "Not supplied"}</dd></div>
            </dl>
          </section>
          <section>
            <header><MapPin size={20} /><div><small>Primary location</small><h2>{primaryLocation?.label || "No active location"}</h2></div></header>
            {primaryLocation ? <address>{[primaryLocation.addressLine1, primaryLocation.addressLine2, primaryLocation.locality, primaryLocation.city, primaryLocation.district, primaryLocation.state, primaryLocation.postalCode].filter(Boolean).join(", ")}</address> : <p>No active business location was returned.</p>}
          </section>
          <section>
            <header><FileCheck2 size={20} /><div><small>Submitted evidence</small><h2>{request.documentType.replaceAll("_", " ").toLowerCase()}</h2></div></header>
            <dl>
              <div><dt>Stored object</dt><dd className="admin-code-value">{request.documentKey}</dd></div>
              <div><dt>SHA-256 fingerprint</dt><dd className="admin-code-value">{request.documentHash}</dd></div>
              <div><dt>Submitted</dt><dd>{new Date(request.createdAt).toLocaleString("en-IN")}</dd></div>
              <div><dt>Last changed</dt><dd>{new Date(request.updatedAt).toLocaleString("en-IN")}</dd></div>
            </dl>
          </section>
        </div>
        <aside className="admin-verification-decision">
          <header><ShieldCheck size={22} /><div><small>Audited decision</small><h2>{canDecide ? "Complete review" : "Decision recorded"}</h2></div></header>
          {canDecide ? (
            <>
              <label>Reviewer notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} minLength={12} maxLength={2000} rows={6} placeholder="Record the evidence checked and the reason for this decision" /></label>
              <label>Rejection reason <small>Required only when rejecting</small><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} minLength={8} maxLength={1000} rows={3} placeholder="Specific corrective action for the business" /></label>
              <div className="admin-verification-actions">
                <button type="button" className="admin-primary-button" disabled={Boolean(busy)} onClick={() => void decide("APPROVED")}><CheckCircle2 size={16} /> {busy === "APPROVED" ? "Approving…" : "Approve"}</button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void decide("MORE_INFORMATION")}><ShieldAlert size={16} /> {busy === "MORE_INFORMATION" ? "Sending…" : "Request information"}</button>
                <button type="button" className="admin-danger-button" disabled={Boolean(busy)} onClick={() => void decide("REJECTED")}><XCircle size={16} /> {busy === "REJECTED" ? "Rejecting…" : "Reject"}</button>
              </div>
            </>
          ) : (
            <dl>
              <div><dt>Status</dt><dd>{request.status.replaceAll("_", " ")}</dd></div>
              <div><dt>Reviewer</dt><dd>{request.reviewer?.email || "Administrator"}</dd></div>
              <div><dt>Reviewed</dt><dd>{request.reviewedAt ? new Date(request.reviewedAt).toLocaleString("en-IN") : "Information requested"}</dd></div>
              <div><dt>Notes</dt><dd>{request.notes || "No note supplied"}</dd></div>
              {request.rejectionReason && <div><dt>Rejection reason</dt><dd>{request.rejectionReason}</dd></div>}
            </dl>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}
