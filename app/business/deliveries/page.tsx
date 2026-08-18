import { BusinessDeliveriesManager } from "@/components/business-deliveries-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessDeliveriesPage() {
  const user = await requireBncSession("/business/deliveries", "business");
  return <BusinessDeliveriesManager user={user} />;
}
