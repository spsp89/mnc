import { BusinessNotificationsManager } from "@/components/business-notifications-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessNotificationsPage() {
  const user = await requireBncSession("/business/notifications", "business");
  return <BusinessNotificationsManager user={user} />;
}
