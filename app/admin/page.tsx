import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin-dashboard-view";
import { getAdminOverviewData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Administration dashboard",
  description: "BNC marketplace operations, verification, trust, payments and audit controls.",
};

export default async function AdminDashboardPage() {
  const user = await requireBncSession("/admin", "admin");
  const data = await getAdminOverviewData();
  return <AdminDashboardView user={user} data={data} />;
}
