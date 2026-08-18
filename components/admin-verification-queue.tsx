"use client";

import { Building2, FileCheck2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type VerificationQueueItem = {
  id: string;
  status: string;
  documentType: string;
  documentHash?: string;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
    status: string;
    owner?: { legalName?: string };
    locations?: Array<{
      locality?: string;
      city?: string;
      district?: string;
      state?: string;
    }>;
  };
};

function queueItems(payload: unknown): VerificationQueueItem[] {
  return Array.isArray(payload) ? (payload as VerificationQueueItem[]) : [];
}

function documentLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function AdminVerificationQueue({ payload }: { payload: unknown }) {
  const requests = useMemo(() => queueItems(payload), [payload]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = status === "ALL" || request.status === status;
      const searchable = [
        request.business.name,
        request.business.owner?.legalName,
        request.documentType,
        request.business.locations?.[0]?.locality,
        request.business.locations?.[0]?.city,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!needle || searchable.includes(needle));
    });
  }, [query, requests, status]);

  return (
    <section className="admin-operations-card">
      <div className="admin-operation-tools">
        <label>
          <Search size={17} />
          <span className="sr-only">Search verification queue</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search business, owner, location, or document" />
        </label>
        <label className="admin-filter-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All active requests</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">In review</option>
            <option value="MORE_INFORMATION">More information</option>
          </select>
        </label>
      </div>
      <div className="admin-record-list">
        {filtered.map((request) => {
          const location = request.business.locations?.[0];
          const place = [location?.locality, location?.city, location?.district].filter(Boolean).join(", ");
          return (
            <article key={request.id}>
              <span className="admin-record-icon"><Building2 size={20} /></span>
              <div className="admin-record-copy">
                <div className="admin-record-meta">
                  <span className={`admin-status admin-status-${request.status.toLowerCase()}`}>{request.status.replaceAll("_", " ")}</span>
                  <span><FileCheck2 size={14} /> {documentLabel(request.documentType)}</span>
                  {place && <span><MapPin size={14} /> {place}</span>}
                </div>
                <h2>{request.business.name}</h2>
                <p>{request.business.owner?.legalName || "Legal owner name not supplied"}</p>
                <small>Submitted {new Date(request.createdAt).toLocaleString("en-IN")} · Request {request.id}</small>
              </div>
              <Link className="admin-primary-link" href={`/admin/verification/${encodeURIComponent(request.id)}`}>Review evidence</Link>
            </article>
          );
        })}
        {!filtered.length && (
          <div className="admin-empty">
            <FileCheck2 size={30} />
            <strong>No verification requests match</strong>
            <span>Try another search or status filter.</span>
          </div>
        )}
      </div>
      <footer><span>{filtered.length} of {requests.length} active requests</span><small>Oldest submissions appear first</small></footer>
    </section>
  );
}
