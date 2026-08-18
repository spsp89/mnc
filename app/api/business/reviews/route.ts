import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(
    `/reviews/business/${encodeURIComponent(businessId)}?page=1&pageSize=50`,
  );
}
