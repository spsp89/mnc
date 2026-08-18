import { NextResponse } from "next/server";
import { apiErrorMessage, apiRequest } from "@/lib/session-config";

export async function POST(request: Request) {
  const upstream = await apiRequest("/auth/password/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
  const body = await upstream.json().catch(() => ({ message: "Password could not be reset." }));
  if (!upstream.ok) {
    return NextResponse.json(
      { message: apiErrorMessage(body, "Password could not be reset.") },
      { status: upstream.status },
    );
  }
  return NextResponse.json(body, { status: upstream.status });
}
