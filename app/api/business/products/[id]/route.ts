import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
