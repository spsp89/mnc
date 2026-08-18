import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function POST(request: Request) {
  const body = await request.json() as { orderId?: string };
  return authenticatedApiRequest(`/deliveries/${encodeURIComponent(body.orderId ?? "")}/cancel`, { method: "POST" });
}
