import { AdminWeeklyDrawManager } from "@/components/admin-weekly-draw-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminWeeklyDrawPage() {
  const user = await requireBncSession("/admin/weekly-draw", "admin");
  return <AdminWeeklyDrawManager user={user} />;
}
