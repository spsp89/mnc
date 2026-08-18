import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: NextRequest) {
  return authenticatedApiRequest(`/enquiries/business?${request.nextUrl.searchParams.toString()}`);
}
