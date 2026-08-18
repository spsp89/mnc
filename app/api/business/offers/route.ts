import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  const response = await authenticatedApiRequest(
    `/offers/manage?businessId=${encodeURIComponent(businessId)}`,
  );
  if (response.status !== 404) return response;

  // Keep the web rollout compatible with an API node that has not yet picked up
  // the dedicated offer-management read contract.
  const legacyResponse = await authenticatedApiRequest(
    `/businesses/manage/${encodeURIComponent(businessId)}`,
  );
  const legacyBody = await legacyResponse.json().catch(() => null) as {
    data?: {
      offers?: Array<Record<string, unknown>>;
      products?: Array<Record<string, unknown>>;
      services?: Array<Record<string, unknown>>;
    };
    message?: string;
  } | null;
  if (!legacyResponse.ok || !legacyBody?.data) {
    return NextResponse.json(
      { message: legacyBody?.message ?? "Offers could not be loaded." },
      { status: legacyResponse.status },
    );
  }
  return NextResponse.json({
    data: (legacyBody.data.offers ?? []).map((offer) => ({
      ...offer,
      products: [],
      services: [],
    })),
    catalog: {
      products: legacyBody.data.products ?? [],
      services: legacyBody.data.services ?? [],
    },
  });
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/offers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
