import { NextRequest, NextResponse } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  const response = await authenticatedApiRequest(
    `/services/manage?businessId=${encodeURIComponent(businessId)}`,
  );
  if (response.status !== 404) return response;

  const legacyResponse = await authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}`,
  );
  const legacyBody = await legacyResponse.json().catch(() => null) as {
    data?: { services?: unknown[] };
    message?: string | string[];
  } | null;
  if (!legacyResponse.ok) {
    return NextResponse.json(
      { message: legacyBody?.message ?? "Services could not be loaded." },
      { status: legacyResponse.status },
    );
  }
  return NextResponse.json({ data: legacyBody?.data?.services ?? [] });
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/services", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
