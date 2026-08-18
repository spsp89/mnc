import { authenticatedApiRequest } from "@/lib/authenticated-api-route";
export async function PUT(request: Request) { return authenticatedApiRequest("/admin/managed-locations/reorder", { method: "PUT", headers: { "content-type": "application/json" }, body: await request.text() }); }
