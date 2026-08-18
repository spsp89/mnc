import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PUT(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}/categories`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: await request.text(),
    },
  );
}
