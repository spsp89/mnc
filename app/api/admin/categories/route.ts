import { authenticatedApiRequest } from "@/lib/authenticated-api-route";
export function GET() { return authenticatedApiRequest("/admin/categories"); }
export async function POST(request: Request) { return authenticatedApiRequest("/admin/categories", { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() }); }
