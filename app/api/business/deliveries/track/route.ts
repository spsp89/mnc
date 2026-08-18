import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId") ?? "";
  return authenticatedApiRequest(`/deliveries/${encodeURIComponent(orderId)}`);
}
