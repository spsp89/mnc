import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

type Context = { params: Promise<{ id: string; eventId: string }> };

export async function POST(_request: Request, context: Context) {
  const { id, eventId } = await context.params;
  return authenticatedApiRequest(
    `/business-club/chapters/${encodeURIComponent(id)}/events/${encodeURIComponent(eventId)}/register`,
    { method: "POST" },
  );
}

export async function DELETE(_request: Request, context: Context) {
  const { id, eventId } = await context.params;
  return authenticatedApiRequest(
    `/business-club/chapters/${encodeURIComponent(id)}/events/${encodeURIComponent(eventId)}/register`,
    { method: "DELETE" },
  );
}
