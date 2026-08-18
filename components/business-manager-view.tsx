"use client";

import { Database, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { BusinessNotificationPreferences } from "@/components/business-notification-preferences";
import type { BncSessionUser } from "@/lib/auth-types";
import type { BusinessSectionData } from "@/lib/portal-data";

export type BusinessManagerSection = "leads" | "enquiries" | "products" | "services" | "jobs" | "reviews" | "offers" | "subscription" | "analytics" | "profile" | "settings" | "messages" | "payments" | "team" | "notifications";

const sectionMeta: Record<BusinessManagerSection, { eyebrow: string; title: string; description: string; action?: string }> = {
  leads: { eyebrow: "Matched demand", title: "Lead manager", description: "Qualified nearby needs will appear after the backend starts routing leads." },
  enquiries: { eyebrow: "Direct customer intent", title: "Enquiries", description: "Customer enquiries will appear after secure backend submission.", action: "/enquiry" },
  products: { eyebrow: "Local marketplace", title: "Products", description: "Products created through the business API will appear here.", action: "/business/products" },
  services: { eyebrow: "What you do", title: "Services", description: "Services created through the business API will appear here.", action: "/business/services" },
  jobs: { eyebrow: "Local hiring", title: "Jobs", description: "Create vacancies and manage their applicants.", action: "/business/jobs" },
  reviews: { eyebrow: "Customer trust", title: "Reviews", description: "Published customer reviews will appear here." },
  offers: { eyebrow: "Timely demand", title: "Offers", description: "Business promotions supplied by the backend will appear here.", action: "/business/offers" },
  subscription: { eyebrow: "Growth plan", title: "Subscription", description: "Plan and billing information will appear after the account is connected.", action: "/pricing" },
  analytics: { eyebrow: "Decision signals", title: "Business analytics", description: "Measured discovery and conversion events will appear after analytics ingestion." },
  profile: { eyebrow: "Profile health", title: "Edit business profile", description: "Backend profile fields will appear after a business is claimed.", action: "/business/add" },
  settings: { eyebrow: "Workspace controls", title: "Business settings", description: "Backend-backed workspace preferences will appear here." },
  messages: { eyebrow: "Customer conversations", title: "Messages", description: "Secure conversations will appear after the messaging service is connected." },
  payments: { eyebrow: "Revenue operations", title: "Payments", description: "Real provider transactions will appear after payment integration." },
  team: { eyebrow: "Shared workspace", title: "Team access", description: "Workspace members will appear after invitations are stored by the backend." },
  notifications: { eyebrow: "Delivery preferences", title: "Notifications", description: "Choose which automatic business alerts you want to receive." },
};

export function BusinessManagerView({
  section,
  user,
  data,
}: {
  section: BusinessManagerSection;
  user: BncSessionUser;
  data: BusinessSectionData;
}) {
  const meta = sectionMeta[section];
  return (
    <DashboardShell mode="business" user={user}>
      <section className="manager-heading">
        <div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{data.workspaceName ? `${data.workspaceName} · live backend records` : meta.description}</p></div>
        <button type="button" disabled><RefreshCw size={14} /> Live API</button>
      </section>
      {section === "notifications" && <BusinessNotificationPreferences />}
      <section className="manager-table-card">
        {data.rows.length ? (
          <div className="manager-enquiry-list">
            {data.rows.map((row) => (
              <article key={row.id}>
                <span>{row.status || "LIVE"}</span>
                <div>
                  <small>{row.subtitle || data.workspaceName}</small>
                  <h2>{row.title}</h2>
                  <p>{row.detail || "Live BNC business record"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <Database size={28} />
            <strong>{data.available ? "No matching records" : "API route not implemented"}</strong>
            <span>{data.available ? "The live backend returned an empty result for this workspace." : "This section does not yet have a dedicated backend read contract."}</span>
            {meta.action && <Link href={meta.action}><Plus size={15} /> Continue setup</Link>}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
