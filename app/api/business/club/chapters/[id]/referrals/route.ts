import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/business-club/chapters/${encodeURIComponent(id)}/referrals`);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/business-club/chapters/${encodeURIComponent(id)}/referrals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
