import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export function GET() { return authenticatedApiRequest("/admin/subscription-plans"); }
export async function POST(request: Request) {
  return authenticatedApiRequest("/admin/subscription-plans", { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() });
}
