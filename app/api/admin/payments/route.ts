import { authenticatedApiRequest } from "@/lib/authenticated-api-route";
export async function GET(request: Request) { const url = new URL(request.url); return authenticatedApiRequest(`/admin/payments${url.search}`); }
export async function POST(request: Request) { return authenticatedApiRequest("/admin/payments", { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() }); }
