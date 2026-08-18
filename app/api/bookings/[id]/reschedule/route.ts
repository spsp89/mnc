import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/bookings/${encodeURIComponent(id)}/reschedule`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
