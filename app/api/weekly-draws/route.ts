import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/session-config";

export async function GET() {
  const upstream = await apiRequest("/weekly-draws");
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
