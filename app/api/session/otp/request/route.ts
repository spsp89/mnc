import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/session-config";

export async function POST(request: Request) {
  const input = (await request.json()) as { phone?: string };
  const upstream = await apiRequest("/auth/otp/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: input.phone, purpose: "login" }),
  });
  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
