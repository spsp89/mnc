"use client";

import { Activity, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import { AdminProductModeration } from "@/components/admin-product-moderation";
import { AdminAnalyticsView } from "@/components/admin-analytics-view";
import { AdminFinanceView } from "@/components/admin-finance-view";
import { AdminRankingManager } from "@/components/admin-ranking-manager";
import { AdminReviewModeration } from "@/components/admin-review-moderation";
import { AdminSupportManager } from "@/components/admin-support-manager";
import { AdminVerificationQueue } from "@/components/admin-verification-queue";
import { AdminRecordsManager } from "@/components/admin-records-manager";
import type { AdminSectionData } from "@/lib/portal-data";
import { AdminBannerManager } from "@/components/admin-banner-manager";
import { AdminOrderEntry } from "@/components/admin-order-entry";
import { AdminTargetedOfferEntry } from "@/components/admin-targeted-offer-entry";
import { AdminAdvertisementEntry } from "@/components/admin-advertisement-entry";
import { AdminAuditLog } from "@/components/admin-audit-log";

export type AdminSection = "businesses" | "users" | "verification" | "reviews" | "leads" | "categories" | "subcategories" | "products" | "services" | "enquiries" | "plans" | "payments" | "refunds" | "orders" | "offers" | "advertisements" | "locations" | "reports" | "support" | "notifications" | "translations" | "search-analytics" | "ranking" | "content" | "audit-log" | "settings" | "system";

const titles: Record<AdminSection, string> = {
  businesses: "Businesses", users: "Users", verification: "Verification queue", reviews: "Review moderation",
  leads: "Lead operations", categories: "Categories", subcategories: "Subcategories", products: "Products",
  services: "Services", enquiries: "Enquiries", plans: "Subscription plans", payments: "Payments",
  refunds: "Refunds", orders: "Orders", offers: "Offers", advertisements: "Advertisements",
  locations: "Locations", reports: "Reports", support: "Support queue", notifications: "Notifications",
  translations: "Content localization", "search-analytics": "Search analytics", ranking: "Ranking configuration",
  content: "Website content", "audit-log": "Audit log", settings: "Administration settings", system: "System readiness",
};

const descriptions: Record<AdminSection, string> = {
  businesses: "Inspect full business records, filter or export the directory, and apply audited status, verification, or premium changes.",
  users: "Inspect accounts, filter or export the directory, and apply audited activation or suspension decisions.",
  verification: "Inspect business identity evidence and record an audited approval, rejection, or information request.",
  reviews: "Publish trustworthy customer reviews or remove content with a recorded moderation reason.",
  leads: "Investigate marketplace leads, export operational data, and correct lifecycle, rejection, expiry, or spam states.",
  categories: "Create marketplace categories, inspect usage counts, export the taxonomy, and control category availability.",
  subcategories: "Create parent-linked subcategories, inspect taxonomy details, and activate or deactivate listings safely.",
  products: "Review submitted product descriptions, pricing, categories, photos, and publication readiness.",
  services: "Inspect service listings and apply audited availability controls without changing business-owned descriptions.",
  enquiries: "Investigate customer enquiries and correct matching, response, closure, expiry, or spam states.",
  plans: "Inspect every subscription plan, compare limits and prices, export plan data, and control availability.",
  payments: "Search the protected payment ledger with transaction status and provider references intact.",
  refunds: "Search the protected refund ledger with request status and payment references intact.",
  orders: "Inspect order detail and apply audited fulfilment, delivery, cancellation, return, or refund states.",
  offers: "Inspect business offers, control visibility, and grant or remove featured marketplace placement.",
  advertisements: "Inspect campaign performance and apply audited scheduling, activation, pause, completion, or rejection states.",
  locations: "Inspect business locations, control availability, and transactionally choose one primary location per business.",
  reports: "Investigate customer reports and record a resolution, dismissal, or reopening decision.",
  support: "Prioritise, assign, and resolve customer and business support work.",
  notifications: "Inspect and export delivery history or compose a targeted, audited in-app support notification.",
  translations: "Compare source and translated copy, mark reviews complete, or save an attributed manual correction.",
  "search-analytics": "Monitor server-recorded marketplace activity, lead flow, and captured value.",
  ranking: "Inspect the active marketplace weights and create a versioned, audited replacement.",
  content: "Create and schedule audited page banners, then preview uploaded business media and approve clean assets or quarantine unsafe content.",
  "audit-log": "Inspect and export the immutable, hash-chained record of sensitive administrative actions.",
  settings: "Inspect privileged role assignments and record audited revocation or restoration decisions.",
  system: "Verify whether the authenticated web application can reach the deployed BNC API.",
};

export function AdminSectionView({
  section,
  user,
  data,
}: {
  section: AdminSection;
  user: BncSessionUser;
  data: AdminSectionData;
}) {
  const title = titles[section];
  const isSystem = section === "system";
  const sectionDescription = data.available
    ? descriptions[section]
    : "This section does not yet expose an administrative read API.";
  return (
    <DashboardShell mode="admin" user={user}>
      <section className="manager-heading admin-section-heading">
        <div><span className="eyebrow">Production administration</span><h1>{title}</h1><p>{sectionDescription}</p></div>
      </section>
      {isSystem ? <SystemReadiness data={data} />
        : section === "products" ? <AdminProductModeration />
          : section === "verification" ? <AdminVerificationQueue payload={data.payload} />
            : section === "reviews" ? <AdminReviewModeration payload={data.payload} />
              : section === "ranking" ? <AdminRankingManager payload={data.payload} />
                : section === "payments" || section === "refunds" ? <AdminFinanceView section={section} payload={data.payload} />
                  : section === "search-analytics" ? <AdminAnalyticsView payload={data.payload} />
                    : section === "support" ? <AdminSupportManager payload={data.payload} />
                      : section === "content" ? <><AdminBannerManager/><AdminRecordsManager key={section} section={section} payload={data.payload} parentCategories={data.parentCategories} /></>
                      : section === "orders" ? <><AdminOrderEntry/><AdminRecordsManager key={section} section={section} payload={data.payload} parentCategories={data.parentCategories} /></>
                      : section === "offers" ? <><AdminTargetedOfferEntry/><AdminRecordsManager key={section} section={section} payload={data.payload} parentCategories={data.parentCategories} /></>
                      : section === "advertisements" ? <><AdminAdvertisementEntry/><AdminRecordsManager key={section} section={section} payload={data.payload} parentCategories={data.parentCategories} /></>
                      : section === "audit-log" ? <AdminAuditLog payload={data.payload} />
                      : data.available ? <AdminRecordsManager key={section} section={section} payload={data.payload} parentCategories={data.parentCategories} />
                        : <section className="admin-directory-card"><div className="admin-empty"><Database size={28} /><strong>API route not implemented</strong><span>This section still needs a dedicated safe read contract.</span></div></section>}
    </DashboardShell>
  );
}

function SystemReadiness({ data }: { data: AdminSectionData }) {
  const status = data.rows[0]?.status || (data.available ? "healthy" : "unavailable");
  return (
    <div className="system-health-grid">
      <section className="system-overview"><span><Activity size={24} /></span><div><small>Deployment readiness</small><h2>BNC API health probe</h2><p>The authenticated web application reached the live API health endpoint.</p></div><strong>{status}</strong></section>
      <section className="system-service-list"><article><i /><div><strong>Public API</strong><small>Live health endpoint</small></div><span>Responding</span><b>{status}</b></article></section>
      <section className="system-note"><ShieldCheck size={18} /><div><strong>Evidence-backed status</strong><p>This screen reports only the API probe currently exposed by the deployment.</p></div><Link href="/contact">Deployment support</Link></section>
    </div>
  );
}
