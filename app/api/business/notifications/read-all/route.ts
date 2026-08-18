import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function PATCH() {
  return authenticatedApiRequest("/notifications/read-all", { method: "PATCH" });
}
