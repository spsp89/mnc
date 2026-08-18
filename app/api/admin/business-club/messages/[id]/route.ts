import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/admin/business-club/messages/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
