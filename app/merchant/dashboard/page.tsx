import type { Metadata } from "next";
import { BusinessDashboardView } from "@/components/business-dashboard-view";
import { getBusinessDashboardData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Merchant dashboard", robots: { index: false, follow: false } };

export default async function MerchantDashboardPage() {
  const user = await requireBncSession("/merchant/dashboard", "business");
  const data = await getBusinessDashboardData(user);
  return <BusinessDashboardView user={user} data={data} portalPrefix="/merchant" />;
}
