import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/admin/refunds/options");
}
