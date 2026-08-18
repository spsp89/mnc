import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function POST(request: Request) {
  return authenticatedApiRequest("/media/downloads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
