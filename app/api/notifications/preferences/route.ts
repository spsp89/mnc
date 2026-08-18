import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/notifications/preferences");
}

export async function PUT(request: Request) {
  return authenticatedApiRequest("/notifications/preferences", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
