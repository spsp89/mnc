import { BusinessSubscriptionManager } from "@/components/business-subscription-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessSubscriptionPage() {
  const user = await requireBncSession("/business/subscription", "business");
  return <BusinessSubscriptionManager user={user} />;
}
