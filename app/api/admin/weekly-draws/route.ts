import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export async function GET() {
  return authenticatedApiRequest("/admin/weekly-draws");
}

export async function POST(request: Request) {
  return authenticatedApiRequest("/admin/weekly-draws", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  });
}
