import { NextRequest, NextResponse } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId") ?? "";
  const response = await authenticatedApiRequest(
    `/payments/business?businessId=${encodeURIComponent(businessId)}`,
  );
  if (response.status !== 404) return response;

  const legacyResponse = await authenticatedApiRequest("/payments/me");
  const legacyBody = await legacyResponse.json().catch(() => null) as {
    data?: Array<{ status?: string; amount?: string | number }>;
    message?: string | string[];
  } | null;
  if (!legacyResponse.ok) {
    return NextResponse.json(
      { message: legacyBody?.message ?? "Payments could not be loaded." },
      { status: legacyResponse.status },
    );
  }
  const payments = legacyBody?.data ?? [];
  const captured = payments.filter((payment) => payment.status === "CAPTURED");
  return NextResponse.json({
    data: {
      payments,
      settlements: [],
      summary: {
        capturedCount: captured.length,
        capturedAmount: captured.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
      },
    },
  });
}
