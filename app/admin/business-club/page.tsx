import { AdminBusinessClubManager } from "@/components/admin-business-club-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminBusinessClubPage() {
  const user = await requireBncSession("/admin/business-club", "admin");
  return <AdminBusinessClubManager user={user} />;
}
