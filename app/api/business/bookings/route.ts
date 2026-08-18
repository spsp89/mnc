import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(`/bookings/manage?businessId=${encodeURIComponent(businessId)}`);
}
