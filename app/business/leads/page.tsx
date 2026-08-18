import { BusinessLeadsManager } from "@/components/business-leads-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessLeadsPage() {
  const user = await requireBncSession("/business/leads", "business");
  return <BusinessLeadsManager user={user} />;
}
