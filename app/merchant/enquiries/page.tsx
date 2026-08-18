import { BusinessEnquiriesManager } from "@/components/business-enquiries-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function MerchantEnquiriesPage() {
  const user = await requireBncSession("/merchant/enquiries", "business");
  return <BusinessEnquiriesManager user={user} />;
}
