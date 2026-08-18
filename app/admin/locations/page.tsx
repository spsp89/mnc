import { AdminTaxonomyManager } from "@/components/admin-taxonomy-manager"; import { requireBncSession } from "@/lib/server-auth";
export default async function AdminLocationsPage() { const user = await requireBncSession("/admin/locations", "admin"); return <AdminTaxonomyManager user={user} kind="locations" />; }
