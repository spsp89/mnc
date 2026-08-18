import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/enquiries/${encodeURIComponent(id)}/close`, {
    method: "POST",
  });
}
