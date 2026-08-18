import { notFound } from "next/navigation";
import { AdminSectionView, type AdminSection } from "@/components/admin-section-view";
import { getAdminSectionData } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

const sections: AdminSection[] = ["businesses", "users", "verification", "reviews", "leads", "categories", "subcategories", "products", "services", "enquiries", "plans", "payments", "refunds", "orders", "offers", "advertisements", "locations", "reports", "support", "notifications", "translations", "search-analytics", "ranking", "content", "audit-log", "settings", "system"];

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as AdminSection)) notFound();
  const user = await requireBncSession(`/admin/${section}`, "admin");
  const data = await getAdminSectionData(section);
  return (
    <AdminSectionView
      section={section as AdminSection}
      user={user}
      data={data}
    />
  );
}
