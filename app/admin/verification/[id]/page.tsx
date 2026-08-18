import { notFound } from "next/navigation";
import { VerificationDetailView } from "@/components/verification-detail-view";
import { getAdminVerificationRequest } from "@/lib/portal-data";
import { requireBncSession } from "@/lib/server-auth";

export default async function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireBncSession(`/admin/verification/${id}`, "admin");
  const request = await getAdminVerificationRequest(id);
  if (!request) notFound();
  return <VerificationDetailView user={user} request={request} />;
}
