import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class WhatsAppProviderService {
  readonly configured: boolean;
  private readonly templates: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.configured = config.get<string>("WHATSAPP_PROVIDER", "DISABLED") === "HTTP";
    try {
      const parsed = JSON.parse(config.get<string>("WHATSAPP_APPROVED_TEMPLATES_JSON", "{}")) as unknown;
      this.templates = parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim())))
        : {};
    } catch {
      this.templates = {};
    }
  }

  templateFor(type: string) {
    return this.templates[type];
  }

  async send(input: { notificationId: string; to: string; type: string; title: string; body: string }) {
    const templateName = this.templateFor(input.type);
    if (!this.configured || !templateName) throw new Error("WhatsApp provider or approved template is not configured.");
    const baseUrl = this.config.getOrThrow<string>("WHATSAPP_API_BASE_URL");
    const path = this.config.get<string>("WHATSAPP_SEND_PATH", "/messages");
    const response = await fetch(new URL(path, baseUrl), {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.getOrThrow<string>("WHATSAPP_API_TOKEN")}`,
        "content-type": "application/json",
        "idempotency-key": input.notificationId,
      },
      body: JSON.stringify({
        to: input.to,
        clientReference: input.notificationId,
        template: {
          name: templateName,
          language: "en",
          parameters: { title: input.title, body: input.body },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`WhatsApp provider rejected the request (${response.status}).`);
    const payload = await response.json() as Record<string, unknown>;
    const providerMessageId = String(payload.id ?? payload.messageId ?? payload.message_id ?? "");
    if (!providerMessageId) throw new Error("WhatsApp provider response did not include a message ID.");
    return { providerMessageId, templateName };
  }
}
