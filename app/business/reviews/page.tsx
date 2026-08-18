import { BusinessReviewsManager } from "@/components/business-reviews-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessReviewsPage() {
  const user = await requireBncSession("/business/reviews", "business");
  return <BusinessReviewsManager user={user} />;
}
