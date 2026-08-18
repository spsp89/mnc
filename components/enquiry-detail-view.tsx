"use client";

import { ArrowLeft, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import type { CustomerEnquiry } from "@/lib/portal-data";
import { StartConversation } from "@/components/enquiry-form";

export function EnquiryDetailView({
  id,
  enquiry,
}: {
  id: string;
  enquiry: CustomerEnquiry | null;
}) {
  return (
    <AppShell headerVariant="immersive">
      <section className="enquiry-detail-page">
        <div className="account-section-hero">
          <div>
            <Link className="back-link" href="/account/enquiries"><ArrowLeft size={15} /> All enquiries</Link>
            <div className="enquiry-detail-heading"><div><span className="eyebrow">{id}</span><h1>{enquiry ? enquiry.businessName : "Enquiry not found"}</h1><p>{enquiry ? `${enquiry.status.replaceAll("_", " ")} · ${enquiry.location}` : "This record is not available to the signed-in account."}</p></div></div>
          </div>
        </div>
        <div className="account-section-content">
          {enquiry ? (
            <section className="enquiry-summary-card">
              <h2>Requirement</h2>
              <p>{enquiry.requirement}</p>
              <dl>
                <div><dt>Status</dt><dd>{enquiry.status.replaceAll("_", " ")}</dd></div>
                <div><dt>Urgency</dt><dd>{enquiry.urgency}</dd></div>
                <div><dt>Location</dt><dd>{enquiry.location}</dd></div>
                <div><dt>Created</dt><dd>{enquiry.createdAt.slice(0, 10)}</dd></div>
              </dl>
              <StartConversation enquiryId={enquiry.id} />
            </section>
          ) : (
            <div className="empty-state"><Database size={30} /><h2>No enquiry data loaded</h2><p>No authorised enquiry matched this URL.</p><Link href="/enquiry">Start a new enquiry</Link></div>
          )}
          <div className="directory-trust"><ShieldCheck size={20} /><div><strong>Contact data stays protected.</strong><p>Customer details should be retrieved only through an authorised backend request.</p></div></div>
        </div>
      </section>
    </AppShell>
  );
}
