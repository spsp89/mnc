import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/session-config";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const upstream = await apiRequest(`/jobs/${encodeURIComponent(id)}/applications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
