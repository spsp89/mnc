import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ section: string; id: string }> },
) {
  const { section, id } = await context.params;
  return authenticatedApiRequest(
    `/admin/operations/${encodeURIComponent(section)}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: await request.text(),
    },
  );
}
