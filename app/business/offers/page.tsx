import { BusinessOffersManager } from "@/components/business-offers-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessOffersPage() {
  const user = await requireBncSession("/business/offers", "business");
  return <BusinessOffersManager user={user} />;
}
