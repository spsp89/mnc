import { BusinessSubscriptionManager } from "@/components/business-subscription-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function MerchantSubscriptionPage() {
  const user = await requireBncSession("/merchant/subscription", "business");
  return <BusinessSubscriptionManager user={user} />;
}
