import { authenticatedApiRequest } from "@/lib/authenticated-api-route";
export async function GET() { return authenticatedApiRequest("/admin/banners"); }
export async function POST(request: Request) { return authenticatedApiRequest("/admin/banners", { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() }); }
