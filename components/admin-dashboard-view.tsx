"use client";

import { Activity, Building2, Database, FileSearch, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import type { BncSessionUser } from "@/lib/auth-types";
import type { AdminOverviewData } from "@/lib/portal-data";

export function AdminDashboardView({
  user,
  data,
}: {
  user: BncSessionUser;
  data: AdminOverviewData;
}) {
  const queues = [
    { label: "Merchants", href: "/admin/merchants", icon: Building2, value: data.businesses },
    { label: "Users", href: "/admin/users", icon: Users, value: data.users },
    { label: "Verification", href: "/admin/verification", icon: ShieldCheck, value: data.pendingVerification },
    { label: "Review queue", href: "/admin/reviews", icon: FileSearch, value: data.pendingReviews },
  ];
  return (
    <DashboardShell mode="admin" user={user}>
      <section className="dashboard-page-heading">
        <div><span className="eyebrow">Platform operations</span><h1>Live administration overview.</h1><p>Authorised metrics below come from the BNC API and shared PostgreSQL database.</p></div>
      </section>
      <section className="dashboard-metric-grid">
        {queues.map(({ label, href, icon: Icon, value }) => <article key={label}><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div><Link href={href}>Open</Link></article>)}
      </section>
      <section className="manager-table-card">
        <div className="business-workspace-list">
          <article><span><ShieldCheck size={19} /></span><div><strong>{data.openTickets} open support tickets</strong><small>Open, in progress, or waiting for customer</small></div><Link href="/admin/support">Open queue</Link></article>
          <article><span><Database size={19} /></span><div><strong>₹{data.capturedPaymentValue.toLocaleString("en-IN")} captured</strong><small>Server-recorded captured payment value</small></div><Link href="/admin/payments">View finance</Link></article>
        </div>
      </section>
      <section className="system-note"><Activity size={18} /><div><strong>Live backend metrics loaded</strong><p>Counts are refreshed from protected API endpoints on each server-rendered request.</p></div><Link href="/admin/system">Open system readiness</Link></section>
    </DashboardShell>
  );
}
