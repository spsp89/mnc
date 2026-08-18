import { authenticatedApiRequest } from "@/lib/authenticated-api-route";
export function GET() { return authenticatedApiRequest("/admin/managed-locations"); }
export async function POST(request: Request) { return authenticatedApiRequest("/admin/managed-locations", { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() }); }
