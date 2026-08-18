import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/session-config";

export async function POST(request: Request) {
  const input = await request.json();
  const upstream = await apiRequest("/auth/email/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
