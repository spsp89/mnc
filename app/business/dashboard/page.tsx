import type { Metadata } from "next";
import { BusinessDashboardView } from "@/components/business-dashboard-view";
import { getBusinessDashboardData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Business dashboard",
  description: "Manage your BNC business profile, leads, enquiries and performance.",
};

export default async function BusinessDashboardPage() {
  const user = await requireBncSession("/business/dashboard", "business");
  const data = await getBusinessDashboardData(user);
  return <BusinessDashboardView user={user} data={data} />;
}
