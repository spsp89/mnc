import { AdminSubscriptionManager } from "@/components/admin-subscription-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminSubscriptionsPage() {
  const user = await requireBncSession("/admin/subscriptions", "admin");
  return <AdminSubscriptionManager user={user} />;
}
