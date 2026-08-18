import { AdminReportsDashboard } from "@/components/admin-reports-dashboard";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminReportsPage() {
  const user = await requireBncSession("/admin/reports", "admin");
  return <AdminReportsDashboard user={user} />;
}
