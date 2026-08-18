import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; referralId: string }> },
) {
  const { id, referralId } = await context.params;
  return authenticatedApiRequest(
    `/business-club/chapters/${encodeURIComponent(id)}/referrals/${encodeURIComponent(referralId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: await request.text(),
    },
  );
}
