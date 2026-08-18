import { NextResponse } from "next/server";
import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

const actions = new Set(["open", "select-winner", "publish"]);

export async function POST(_request: Request, context: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await context.params;
  if (!actions.has(action)) return NextResponse.json({ message: "Unsupported draw action." }, { status: 404 });
  return authenticatedApiRequest(`/admin/weekly-draws/${encodeURIComponent(id)}/${action}`, { method: "POST" });
}
