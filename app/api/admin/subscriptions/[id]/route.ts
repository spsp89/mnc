import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return authenticatedApiRequest(`/admin/subscriptions/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: await request.text() });
}
