import { AdminUserManager } from "@/components/admin-user-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminUsersPage() {
  const user = await requireBncSession("/admin/users", "admin");
  return <AdminUserManager user={user} />;
}
