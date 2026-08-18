import { BusinessPaymentsManager } from "@/components/business-payments-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessPaymentsPage() {
  const user = await requireBncSession("/business/payments", "business");
  return <BusinessPaymentsManager user={user} />;
}
