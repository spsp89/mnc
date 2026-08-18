import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  return authenticatedApiRequest(`/deliveries/${encodeURIComponent(orderId)}/settle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
