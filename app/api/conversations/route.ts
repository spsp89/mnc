import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/conversations?page=1&pageSize=50");
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
