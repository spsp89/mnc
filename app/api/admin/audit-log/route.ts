import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export function GET(request: NextRequest) {
  return authenticatedApiRequest(`/admin/audit-log?${request.nextUrl.searchParams.toString()}`);
}
