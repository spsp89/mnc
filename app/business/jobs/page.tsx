import { BusinessJobsManager } from "@/components/business-jobs-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessJobsPage() {
  const user = await requireBncSession("/business/jobs", "business");
  return <BusinessJobsManager user={user} />;
}
