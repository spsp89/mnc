import { BusinessProfileExtras } from "@/components/business-profile-extras";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessProfileEditPage() {
  const user = await requireBncSession("/business/profile/edit", "business");
  return <BusinessProfileExtras user={user} />;
}
