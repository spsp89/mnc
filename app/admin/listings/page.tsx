import { AdminListingsManager } from "@/components/admin-listings-manager"; import { requireBncSession } from "@/lib/server-auth";
export default async function AdminListingsPage() { const user = await requireBncSession("/admin/listings", "admin"); return <AdminListingsManager user={user} />; }
