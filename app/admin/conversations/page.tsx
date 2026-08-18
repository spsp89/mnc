import { AdminConversationsManager } from "@/components/admin-conversations-manager";
import { requireBncSession } from "@/lib/server-auth";

export default async function AdminConversationsPage() {
  const user = await requireBncSession("/admin/conversations", "admin");
  return <AdminConversationsManager user={user} />;
}
