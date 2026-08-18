import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/session-config";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const placement = url.searchParams.get("placement");
  const upstream = await apiRequest(`/content/banners${placement ? `?placement=${encodeURIComponent(placement)}` : ""}`);
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" } });
}
