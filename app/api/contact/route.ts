import { z } from "zod";
import { isSameOriginMutation } from "@/lib/request-security";
import { getRuntimeBindings } from "@/lib/runtime-bindings";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(180),
  topic: z.enum(["support", "business", "plans", "privacy", "press", "other"]),
  message: z.string().trim().min(15).max(2000),
});

type RuntimeEnv = { DB?: D1Database };

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Cross-origin submission blocked." }, { status: 403 });
  const input = contactSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "Please complete every field with a valid email and message." }, { status: 400 });
  const runtime = await getRuntimeBindings<RuntimeEnv>();
  if (!runtime.DB) {
    return Response.json({ error: "Support storage is unavailable." }, { status: 503 });
  }
  const recentCount = await runtime.DB.prepare(
    "SELECT COUNT(*) AS count FROM contact_requests WHERE email = ? AND created_at >= datetime('now', '-1 hour')",
  ).bind(input.data.email.toLowerCase()).first<{ count: number }>();
  if ((recentCount?.count ?? 0) >= 4) return Response.json({ error: "Too many recent requests. Please wait before sending another." }, { status: 429 });
  const id = crypto.randomUUID();
  await runtime.DB.prepare(
    "INSERT INTO contact_requests (id, name, email, topic, message, status) VALUES (?, ?, ?, ?, ?, 'open')",
  ).bind(id, input.data.name, input.data.email.toLowerCase(), input.data.topic, input.data.message).run();
  return Response.json({ id, status: "received" }, { status: 201 });
}
