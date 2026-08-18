import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/orders/me");
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
