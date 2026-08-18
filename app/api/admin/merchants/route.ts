import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["page", "pageSize", "q", "status", "planId", "location", "from", "to"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value);
  }
  return authenticatedApiRequest(`/admin/merchants?${params.toString()}`);
}
