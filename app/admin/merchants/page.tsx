import type { Metadata } from "next";
import { AdminMerchantQueue } from "@/components/admin-merchant-queue";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Merchant administration", robots: { index: false, follow: false } };

export default async function AdminMerchantsPage() {
  const user = await requireBncSession("/admin/merchants", "admin");
  return <AdminMerchantQueue user={user} />;
}
