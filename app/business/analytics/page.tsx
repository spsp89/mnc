import { BusinessAnalyticsManager } from "@/components/business-analytics-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessAnalyticsPage() {
  const user = await requireBncSession("/business/analytics", "business");
  return <BusinessAnalyticsManager user={user} />;
}
