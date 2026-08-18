import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  return authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}/team`,
  );
}

export async function POST(request: Request) {
  const input = (await request.json()) as {
    businessId?: string;
    email?: string;
    role?: string;
  };
  const { businessId = "", ...payload } = input;
  return authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}/team`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
