import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/admin/conversations?page=1&pageSize=100");
}
