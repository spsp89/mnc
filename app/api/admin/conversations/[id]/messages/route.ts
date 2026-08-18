import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/admin/conversations/${encodeURIComponent(id)}/messages`);
}
