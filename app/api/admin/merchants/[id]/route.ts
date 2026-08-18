import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return authenticatedApiRequest(`/admin/merchants/${encodeURIComponent(id)}`);
}
