import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return authenticatedApiRequest(`/enquiries/business/${encodeURIComponent(id)}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: await request.text() });
}
