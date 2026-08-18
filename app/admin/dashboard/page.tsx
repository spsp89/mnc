import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin-dashboard-view";
import { getAdminOverviewData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Administration dashboard", robots: { index: false, follow: false } };

export default async function AdminDashboardRoute() {
  const user = await requireBncSession("/admin/dashboard", "admin");
  const data = await getAdminOverviewData();
  return <AdminDashboardView user={user} data={data} />;
}
