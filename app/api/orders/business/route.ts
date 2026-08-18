import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(`/orders/business?businessId=${encodeURIComponent(businessId)}`);
}
