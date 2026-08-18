import { NextResponse } from "next/server";
import { apiErrorMessage, apiRequest } from "@/lib/session-config";

export async function POST(request: Request) {
  const upstream = await apiRequest("/auth/password/request-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
  const body = await upstream.json().catch(() => ({ message: "Password reset could not be requested." }));
  if (!upstream.ok) {
    return NextResponse.json(
      { message: apiErrorMessage(body, "Password reset could not be requested.") },
      { status: upstream.status },
    );
  }
  return NextResponse.json(body, { status: upstream.status });
}
