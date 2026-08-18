import { NextRequest } from "next/server";
import { apiRequest } from "@/lib/session-config";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const upstream = await apiRequest(`/booking-availability/providers?${query}`);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
