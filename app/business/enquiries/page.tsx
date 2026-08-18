import { BusinessEnquiriesManager } from "@/components/business-enquiries-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessEnquiriesPage() {
  const user = await requireBncSession("/business/enquiries", "business");
  return <BusinessEnquiriesManager user={user} />;
}
