import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return authenticatedApiRequest(`/admin/refunds${url.search}`);
}
