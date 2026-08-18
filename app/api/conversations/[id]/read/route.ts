import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/conversations/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}
