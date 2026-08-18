import { BusinessTeamManager } from "@/components/business-team-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessTeamPage() {
  const user = await requireBncSession("/business/team", "business");
  return <BusinessTeamManager user={user} />;
}
