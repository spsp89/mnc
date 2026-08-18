import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/conversations/${encodeURIComponent(id)}/messages?page=1&pageSize=100`);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
