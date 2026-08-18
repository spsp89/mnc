import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(
    `/weekly-draws/${encodeURIComponent(id)}/entries?businessId=${encodeURIComponent(businessId)}`,
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return authenticatedApiRequest(`/weekly-draws/${encodeURIComponent(id)}/entries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
