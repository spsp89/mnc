import { BusinessServicesManager } from "@/components/business-services-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessServicesPage() {
  const user = await requireBncSession("/business/services", "business");
  return <BusinessServicesManager user={user} />;
}
