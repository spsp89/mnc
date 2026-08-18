import { BusinessClubManager } from "@/components/business-club-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessClubPage() {
  const user = await requireBncSession("/business/club", "business");
  return <BusinessClubManager user={user} />;
}
