import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(`/leads/referrals?businessId=${encodeURIComponent(businessId)}`);
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/leads/referrals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
