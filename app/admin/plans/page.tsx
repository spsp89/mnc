import { AdminPlanManager } from "@/components/admin-plan-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminPlansPage() {
  const user = await requireBncSession("/admin/plans", "admin");
  return <AdminPlanManager user={user} />;
}
