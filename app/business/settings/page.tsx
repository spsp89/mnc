import { BusinessSettingsManager } from "@/components/business-settings-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function BusinessSettingsPage() {
  const user = await requireBncSession("/business/settings", "business");
  return <BusinessSettingsManager user={user} />;
}
