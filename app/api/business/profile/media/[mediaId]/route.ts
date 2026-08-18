import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  const { mediaId } = await params;
  return authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}/media/${encodeURIComponent(mediaId)}`,
    { method: "DELETE" },
  );
}
