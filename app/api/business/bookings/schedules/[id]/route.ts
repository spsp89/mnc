import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/bookings/schedules/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
