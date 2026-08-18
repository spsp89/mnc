import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await context.params;
  const input = (await request.json()) as {
    businessId?: string;
    role?: string;
    active?: boolean;
  };
  const { businessId = "", ...payload } = input;
  return authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}/team/${encodeURIComponent(memberId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
