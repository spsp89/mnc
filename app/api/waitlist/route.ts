import { createHmac } from "node:crypto";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/request-security";
import { getRuntimeBindings } from "@/lib/runtime-bindings";

const inputSchema = z.object({
  phone: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(15)),
  locale: z.literal("en").default("en"),
});

type RuntimeEnv = { DB?: D1Database; ENQUIRY_DATA_KEY?: string; FINGERPRINT_KEY?: string };

async function encrypt(value: string, secret: string) {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  const key = await crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(value));
  const payload = new Uint8Array(iv.length + cipher.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...payload));
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Cross-origin submission blocked." }, { status: 403 });
  const input = inputSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "Enter a valid mobile number." }, { status: 400 });
  const runtime = await getRuntimeBindings<RuntimeEnv>();
  if (!runtime.DB) {
    return Response.json({ error: "Waitlist storage is unavailable." }, { status: 503 });
  }
  const secret = runtime.ENQUIRY_DATA_KEY ?? (process.env.NODE_ENV === "production" ? null : "bnc-local-development-encryption-key");
  if (!secret) return Response.json({ error: "Secure waitlist processing is not configured." }, { status: 503 });
  const fingerprint = createHmac("sha256", runtime.FINGERPRINT_KEY ?? secret)
    .update(`phone:${input.data.phone}`)
    .digest("hex");
  const existing = await runtime.DB.prepare("SELECT id FROM app_waitlist WHERE phone_fingerprint = ? LIMIT 1").bind(fingerprint).first();
  if (existing) return Response.json({ status: "already_registered" });
  const id = crypto.randomUUID();
  await runtime.DB.prepare("INSERT INTO app_waitlist (id, phone_encrypted, phone_fingerprint, locale) VALUES (?, ?, ?, ?)")
    .bind(id, await encrypt(input.data.phone, secret), fingerprint, input.data.locale).run();
  return Response.json({ id, status: "registered" }, { status: 201 });
}
