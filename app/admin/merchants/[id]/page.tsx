import type { Metadata } from "next";
import { AdminMerchantDetail } from "@/components/admin-merchant-detail";
import { requireBncSession } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Merchant detail", robots: { index: false, follow: false } };

export default async function AdminMerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireBncSession(`/admin/merchants/${id}`, "admin");
  return <AdminMerchantDetail user={user} merchantId={id} />;
}
