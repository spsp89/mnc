import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function POST(
  request: Request,
  context: { params: Promise<{ section: string }> },
) {
  const { section } = await context.params;
  return authenticatedApiRequest(`/admin/operations/${encodeURIComponent(section)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
