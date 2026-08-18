import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().url().optional(),
);

const optionalString = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().min(1).optional(),
);

const optionalStringWithMinimum = (minimum: number) => z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().min(minimum).optional(),
);

const booleanFlag = z.preprocess(
  (value) => typeof value === "string" ? value.toLowerCase() === "true" : value,
  z.boolean().default(false),
);

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().url(),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(5_000),
  HEALTH_READINESS_TIMEOUT_MS: z.coerce.number().int().min(250).max(30_000).default(3_000),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  OTP_HASH_SECRET: z.string().min(24),
  DRAW_CODE_SECRET: z.string().min(32),
  DRAW_FEATURE_ENABLED: booleanFlag,
  DRAW_LEGAL_APPROVAL_REFERENCE: optionalStringWithMinimum(6),
  TEST_FIXED_OTP_ENABLED: booleanFlag,
  ENQUIRY_DATA_KEY: z.string().min(24),
  RAZORPAY_KEY_ID: optionalStringWithMinimum(8),
  RAZORPAY_KEY_SECRET: optionalStringWithMinimum(16),
  RAZORPAY_WEBHOOK_SECRET: optionalStringWithMinimum(16),
  GOOGLE_CLIENT_ID: optionalStringWithMinimum(20),
  OBJECT_STORAGE_ENDPOINT: optionalUrl,
  OBJECT_STORAGE_REGION: z.string().min(2).default("ap-south-1"),
  OBJECT_STORAGE_BUCKET: z.string().min(3).max(63),
  OBJECT_STORAGE_ACCESS_KEY_ID: optionalString,
  OBJECT_STORAGE_SECRET_ACCESS_KEY: optionalString,
  OBJECT_STORAGE_PUBLIC_URL: optionalUrl,
  OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),
  OBJECT_STORAGE_MAX_IMAGE_BYTES: z.coerce.number().int().min(100_000).max(25_000_000).default(10_000_000),
  OBJECT_STORAGE_MAX_DOCUMENT_BYTES: z.coerce.number().int().min(100_000).max(10_000_000).default(5_000_000),
  DELIVERY_PROVIDER: z.enum(["MANUAL", "PORTER", "HTTP"]).default("MANUAL"),
  DELIVERY_API_BASE_URL: optionalUrl,
  DELIVERY_API_TOKEN: optionalString,
  DELIVERY_QUOTE_PATH: z.string().default("/quotes"),
  DELIVERY_CREATE_PATH: z.string().default("/deliveries"),
  DELIVERY_STATUS_PATH: z.string().default("/deliveries/{id}"),
  DELIVERY_CANCEL_PATH: z.string().default("/deliveries/{id}/cancel"),
  DELIVERY_WEBHOOK_SECRET: optionalStringWithMinimum(16),
  FIREBASE_SERVICE_ACCOUNT_JSON: optionalString,
  WHATSAPP_PROVIDER: z.enum(["DISABLED", "HTTP"]).default("DISABLED"),
  WHATSAPP_API_BASE_URL: optionalUrl,
  WHATSAPP_API_TOKEN: optionalString,
  WHATSAPP_SEND_PATH: z.string().default("/messages"),
  WHATSAPP_WEBHOOK_SECRET: optionalStringWithMinimum(16),
  WHATSAPP_APPROVED_TEMPLATES_JSON: z.string().default("{}"),
  WHATSAPP_DAILY_LIMIT: z.coerce.number().int().min(1).max(20).default(3),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
}).superRefine((environment, context) => {
  const hasAccessKey = Boolean(environment.OBJECT_STORAGE_ACCESS_KEY_ID);
  const hasSecretKey = Boolean(environment.OBJECT_STORAGE_SECRET_ACCESS_KEY);
  if (hasAccessKey !== hasSecretKey) {
    context.addIssue({
      code: "custom",
      path: ["OBJECT_STORAGE_ACCESS_KEY_ID"],
      message: "Object storage access key and secret must be configured together.",
    });
  }
  if (environment.DELIVERY_PROVIDER !== "MANUAL") {
    for (const [key, value] of [
      ["DELIVERY_API_BASE_URL", environment.DELIVERY_API_BASE_URL],
      ["DELIVERY_API_TOKEN", environment.DELIVERY_API_TOKEN],
      ["DELIVERY_WEBHOOK_SECRET", environment.DELIVERY_WEBHOOK_SECRET],
    ] as const) {
      if (!value) context.addIssue({ code: "custom", path: [key], message: `${key} is required for an external delivery provider.` });
    }
    if (environment.NODE_ENV === "production" && environment.DELIVERY_API_BASE_URL?.startsWith("http://")) {
      context.addIssue({ code: "custom", path: ["DELIVERY_API_BASE_URL"], message: "Production delivery APIs must use HTTPS." });
    }
    for (const key of ["DELIVERY_STATUS_PATH", "DELIVERY_CANCEL_PATH"] as const) {
      if (!environment[key].includes("{id}")) {
        context.addIssue({ code: "custom", path: [key], message: `${key} must contain the {id} placeholder.` });
      }
    }
  }
  let templates: unknown;
  try {
    templates = JSON.parse(environment.WHATSAPP_APPROVED_TEMPLATES_JSON);
  } catch {
    context.addIssue({ code: "custom", path: ["WHATSAPP_APPROVED_TEMPLATES_JSON"], message: "WhatsApp templates must be a JSON object." });
  }
  if (templates !== undefined && (typeof templates !== "object" || templates === null || Array.isArray(templates))) {
    context.addIssue({ code: "custom", path: ["WHATSAPP_APPROVED_TEMPLATES_JSON"], message: "WhatsApp templates must be a JSON object." });
  }
  if (environment.WHATSAPP_PROVIDER !== "DISABLED") {
    for (const [key, value] of [
      ["WHATSAPP_API_BASE_URL", environment.WHATSAPP_API_BASE_URL],
      ["WHATSAPP_API_TOKEN", environment.WHATSAPP_API_TOKEN],
      ["WHATSAPP_WEBHOOK_SECRET", environment.WHATSAPP_WEBHOOK_SECRET],
    ] as const) {
      if (!value) context.addIssue({ code: "custom", path: [key], message: `${key} is required for an external WhatsApp provider.` });
    }
    if (environment.NODE_ENV === "production" && environment.WHATSAPP_API_BASE_URL?.startsWith("http://")) {
      context.addIssue({ code: "custom", path: ["WHATSAPP_API_BASE_URL"], message: "Production WhatsApp APIs must use HTTPS." });
    }
    if (!templates || !Object.keys(templates).length) {
      context.addIssue({ code: "custom", path: ["WHATSAPP_APPROVED_TEMPLATES_JSON"], message: "At least one approved template is required when WhatsApp is enabled." });
    }
  }
  if (environment.DRAW_FEATURE_ENABLED && !environment.DRAW_LEGAL_APPROVAL_REFERENCE) {
    context.addIssue({
      code: "custom",
      path: ["DRAW_LEGAL_APPROVAL_REFERENCE"],
      message: "A legal/tax approval reference is required before draws can be enabled.",
    });
  }
});

export type Environment = z.infer<typeof environmentSchema>;
