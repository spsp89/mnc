"use client";

import { BarChart3, CalendarClock, Database, MessageCircle, MousePointerClick, Store, Tag } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import type { BusinessDashboardData } from "@/lib/portal-data";

export function BusinessDashboardView({
  user,
  data,
  portalPrefix = "/business",
}: {
  user: BncSessionUser;
  data: BusinessDashboardData;
  portalPrefix?: "/business" | "/merchant";
}) {
  const metrics = [
    { label: "Total listings", icon: Store, value: data.totalListings },
    { label: "Active listings", icon: Store, value: data.activeListings },
    { label: "Active offers", icon: Tag, value: data.activeOffers },
    { label: "Leads received", icon: MessageCircle, value: data.leadsReceived },
    { label: "New leads", icon: MessageCircle, value: data.newLeads },
    { label: "Current subscription", icon: BarChart3, value: data.currentSubscription },
    { label: "Plan expiry", icon: CalendarClock, value: data.planExpiry ? new Date(data.planExpiry).toLocaleDateString("en-IN") : "—" },
  ];
  const recordedMetrics = [
    { label: "Listing views", value: data.listingViews },
    { label: "Contact clicks", value: data.contactClicks },
    { label: "WhatsApp clicks", value: data.whatsappClicks },
  ];
  return (
    <DashboardShell mode="business" user={user}>
      <section className="dashboard-page-heading">
        <div><span className="eyebrow">Business workspace</span><h1>Manage what customers see.</h1><p>{data.selectedBusinessName ? `Portfolio KPIs cover your authorised listings; subscription and expiry are for ${data.selectedBusinessName}.` : "Your owned and invited workspaces are protected by role-specific permissions."}</p></div>
        <Link href="/business/add">Create or claim a business</Link>
      </section>
      {!data.available && <section className="manager-table-card"><div className="admin-empty"><Database size={28} /><strong>Dashboard metrics unavailable</strong><span>The aggregate API did not return data. No placeholder analytics are being shown.</span></div></section>}
      {data.available && <section className="dashboard-metric-grid">
        {metrics.map(({ label, icon: Icon, value }) => <article key={label}><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}
      </section>}
      {data.available && <section className="manager-table-card"><header><div><strong>Recorded engagement</strong><span>Only persisted analytics events are shown.</span></div></header><div className="manager-summary-grid business-compact-summary">{recordedMetrics.map((metric) => <article key={metric.label}><MousePointerClick size={19} /><div><strong>{metric.value}</strong><small>{metric.label}</small></div></article>)}</div></section>}
      <section className="manager-table-card">
        {user.businesses.length ? (
          <div className="business-workspace-list">
            {user.businesses.map((business) => (
              <article key={business.id}>
                <span><Store size={19} /></span>
                <div><strong>{business.name}</strong><small>{business.status.replaceAll("_", " ")} · {business.accessRole.replaceAll("_", " ")}</small></div>
                <Link href={portalPrefix === "/merchant" ? "/merchant/profile" : "/business/products"}>{portalPrefix === "/merchant" ? "Manage profile" : "Manage catalogue"}</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty"><Database size={30} /><strong>No business workspace yet</strong><span>Create a draft business or claim an existing listing to continue.</span></div>
        )}
      </section>
    </DashboardShell>
  );
}
