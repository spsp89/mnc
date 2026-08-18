import { NextRequest } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export function GET(request: NextRequest) {
  return authenticatedApiRequest(`/admin/subscriptions?${request.nextUrl.searchParams.toString()}`);
}
export async function POST(request: Request) {
  return authenticatedApiRequest("/admin/subscriptions", { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() });
}
