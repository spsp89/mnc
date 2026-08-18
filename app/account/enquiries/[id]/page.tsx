import type { Metadata } from "next";
import { requireBncSession } from "@/lib/server-auth";
import { EnquiryDetailView } from "@/components/enquiry-detail-view";
import { getCustomerPortalData } from "@/lib/portal-data";

export const metadata: Metadata = { title: "Enquiry detail" };
export const dynamic = "force-dynamic";

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireBncSession(`/account/enquiries/${id}`, "customer");
  const data = await getCustomerPortalData();
  return <EnquiryDetailView id={id} enquiry={data.enquiries.find((item) => item.id === id) ?? null} />;
}
