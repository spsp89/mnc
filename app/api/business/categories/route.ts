import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/session-config";

export async function GET() {
  const upstream = await apiRequest("/categories?language=en");
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
