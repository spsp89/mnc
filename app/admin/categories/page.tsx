import { AdminTaxonomyManager } from "@/components/admin-taxonomy-manager"; import { requireBncSession } from "@/lib/server-auth";
export default async function AdminCategoriesPage() { const user = await requireBncSession("/admin/categories", "admin"); return <AdminTaxonomyManager user={user} kind="categories" />; }
