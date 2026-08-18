import { NextRequest, NextResponse } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  const [currentResponse, plansResponse] = await Promise.all([
    authenticatedApiRequest(
      `/subscriptions/current?businessId=${encodeURIComponent(businessId)}`,
    ),
    authenticatedApiRequest("/subscriptions/plans"),
  ]);
  const [currentBody, plansBody] = await Promise.all([
    currentResponse.json().catch(() => null),
    plansResponse.json().catch(() => null),
  ]) as [
    { data?: unknown[]; message?: string | string[] } | null,
    { data?: unknown[]; message?: string | string[] } | null,
  ];
  if (!currentResponse.ok || !plansResponse.ok) {
    return NextResponse.json(
      {
        message:
          currentBody?.message ??
          plansBody?.message ??
          "Subscription details could not be loaded.",
      },
      { status: !currentResponse.ok ? currentResponse.status : plansResponse.status },
    );
  }
  return NextResponse.json({
    data: {
      subscriptions: currentBody?.data ?? [],
      plans: plansBody?.data ?? [],
    },
  });
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/subscriptions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
