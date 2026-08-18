import { createHash, createHmac } from "node:crypto";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/request-security";
import { getRuntimeBindings } from "@/lib/runtime-bindings";

const applicationSchema = z.object({
  applicationType: z.enum(["add", "claim"]),
  businessName: z.string().trim().min(2).max(140),
  ownerName: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  locality: z.string().trim().min(2).max(100),
  phone: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(15)),
  requestedPlan: z.enum(["free", "growth", "select"]).default("free"),
  consent: z.literal("true"),
});

type RuntimeEnv = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  ENQUIRY_DATA_KEY?: string;
  FINGERPRINT_KEY?: string;
};

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

async function encrypt(value: string, secret: string) {
  const bytes = new TextEncoder();
  const material = await crypto.subtle.digest("SHA-256", bytes.encode(secret));
  const key = await crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes.encode(value));
  const payload = new Uint8Array(iv.byteLength + cipher.byteLength);
  payload.set(iv);
  payload.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...payload));
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Cross-origin submission blocked." }, { status: 403 });
  const form = await request.formData();
  const input = applicationSchema.safeParse(Object.fromEntries([...form.entries()].filter(([key]) => key !== "proof")));
  if (!input.success) {
    return Response.json({ error: "Please review all required business details.", details: input.error.flatten().fieldErrors }, { status: 400 });
  }

  const proof = form.get("proof");
  if (proof instanceof File && proof.size > 0 && (proof.size > 5_000_000 || !["application/pdf", "image/jpeg", "image/png"].includes(proof.type))) {
    return Response.json({ error: "Proof must be a PDF, JPG or PNG under 5 MB." }, { status: 400 });
  }

  const runtime = await getRuntimeBindings<RuntimeEnv>();
  if (!runtime.DB) {
    return Response.json({ error: "Application storage is unavailable." }, { status: 503 });
  }

  const secret = runtime.ENQUIRY_DATA_KEY ?? (process.env.NODE_ENV === "production" ? null : "bnc-local-development-encryption-key");
  if (!secret) return Response.json({ error: "Secure application processing is not configured." }, { status: 503 });

  const id = crypto.randomUUID();
  const fingerprint = createHmac("sha256", runtime.FINGERPRINT_KEY ?? secret)
    .update(`phone:${input.data.phone}`)
    .digest("hex");
  const duplicate = await runtime.DB.prepare(
    "SELECT id FROM business_applications WHERE phone_fingerprint = ? AND business_name = ? AND created_at >= datetime('now', '-1 day') LIMIT 1",
  ).bind(fingerprint, input.data.businessName).first();
  if (duplicate) return Response.json({ error: "An application for this business was already submitted recently." }, { status: 409 });

  let proofObjectKey: string | null = null;
  if (proof instanceof File && proof.size > 0) {
    if (!runtime.MEDIA) return Response.json({ error: "Document storage is unavailable." }, { status: 503 });
    proofObjectKey = `business-applications/${id}/${digest(proof.name).slice(0, 16)}`;
    await runtime.MEDIA.put(proofObjectKey, proof.stream(), { httpMetadata: { contentType: proof.type } });
  }

  await runtime.DB.prepare(
    `INSERT INTO business_applications (
      id, application_type, business_name, owner_name, category, city, locality,
      phone_encrypted, phone_fingerprint, proof_object_key, requested_plan,
      status, consent_granted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`,
  ).bind(
    id,
    input.data.applicationType,
    input.data.businessName,
    input.data.ownerName,
    input.data.category,
    input.data.city,
    input.data.locality,
    await encrypt(input.data.phone, secret),
    fingerprint,
    proofObjectKey,
    input.data.requestedPlan,
  ).run();

  return Response.json({ id, status: "pending", message: "Application submitted for review." }, { status: 201 });
}
