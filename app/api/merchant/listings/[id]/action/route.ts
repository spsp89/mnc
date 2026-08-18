import { authenticatedApiRequest } from "@/lib/authenticated-api-route";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return authenticatedApiRequest(`/businesses/manage/${encodeURIComponent(id)}/listing-action`, { method: "POST", headers: { "content-type": "application/json" }, body: await request.text() }); }
