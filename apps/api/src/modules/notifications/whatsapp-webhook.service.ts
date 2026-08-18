import { Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";

@Injectable()
export class WhatsAppWebhookService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async receive(signatureValue: string | undefined, eventIdValue: string | undefined, rawBody: Buffer, payload: Record<string, unknown>) {
    if (this.config.get<string>("WHATSAPP_PROVIDER", "DISABLED") === "DISABLED") {
      throw new ServiceUnavailableException("WhatsApp provider callbacks are disabled.");
    }
    const secret = this.config.get<string>("WHATSAPP_WEBHOOK_SECRET");
    const signature = signatureValue?.replace(/^sha256=/i, "").trim().toLowerCase();
    const calculated = secret ? createHmac("sha256", secret).update(rawBody).digest("hex") : "";
    if (!secret || !signature || calculated.length !== signature.length || !timingSafeEqual(Buffer.from(calculated), Buffer.from(signature))) {
      throw new UnauthorizedException("Invalid WhatsApp webhook signature.");
    }
    const eventId = eventIdValue?.trim();
    if (!eventId) throw new UnauthorizedException("WhatsApp webhook event ID is required.");
    const eventType = String(payload.event ?? payload.type ?? "message.status").slice(0, 120);
    let event: { id: string };
    try {
      event = await this.prisma.webhookEvent.create({
        data: {
          provider: "WHATSAPP_HTTP",
          eventId,
          eventType,
          payloadHash: createHash("sha256").update(rawBody).digest("hex"),
          payload: payload as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") return { received: true, duplicate: true };
      throw error;
    }

    try {
      if (this.isOptOut(eventType, payload)) {
        const phone = String(payload.phone ?? payload.from ?? "").trim();
        const user = phone ? await this.prisma.user.findUnique({ where: { phone }, select: { id: true } }) : null;
        if (!user) throw new NotFoundException("WhatsApp opt-out user was not found.");
        await this.prisma.$transaction(async (transaction) => {
          await transaction.consent.create({ data: { userId: user.id, type: "WHATSAPP_NOTIFICATIONS", scope: { all: true }, granted: false, source: "support", withdrawnAt: new Date() } });
          await transaction.notificationPreference.updateMany({ where: { userId: user.id }, data: { whatsapp: false } });
          await transaction.webhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", attempts: { increment: 1 }, processedAt: new Date() } });
        });
        return { received: true, optedOut: true };
      }

      const notificationId = String(payload.clientReference ?? payload.notificationId ?? payload.reference ?? "");
      const notification = notificationId ? await this.prisma.notification.findUnique({ where: { id: notificationId } }) : null;
      if (!notification || notification.channel !== "WHATSAPP") throw new NotFoundException("WhatsApp notification was not found.");
      const status = String(payload.status ?? eventType).trim().toUpperCase();
      const supported = new Set(["ACCEPTED", "SENT", "DELIVERED", "READ", "FAILED", "REJECTED"]);
      if (!supported.has(status)) {
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", attempts: { increment: 1 }, processedAt: new Date() } });
        return { received: true, ignored: true };
      }
      const metadata = notification.data && typeof notification.data === "object" && !Array.isArray(notification.data)
        ? notification.data as Record<string, unknown>
        : {};
      const failed = status === "FAILED" || status === "REJECTED";
      await this.prisma.$transaction(async (transaction) => {
        await transaction.notification.update({
          where: { id: notification.id },
          data: {
            sentAt: failed ? notification.sentAt : (notification.sentAt ?? new Date()),
            failedAt: failed ? new Date() : null,
            failure: failed ? String(payload.reason ?? payload.error ?? "Provider reported WhatsApp delivery failure.").slice(0, 500) : null,
            data: { ...metadata, providerStatus: status, providerStatusAt: new Date().toISOString() } as Prisma.InputJsonValue,
          },
        });
        await transaction.webhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", attempts: { increment: 1 }, processedAt: new Date() } });
      });
      return { received: true, status };
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", attempts: { increment: 1 }, error: error instanceof Error ? error.message.slice(0, 500) : "Unknown WhatsApp callback error." },
      });
      throw error;
    }
  }

  private isOptOut(eventType: string, payload: Record<string, unknown>) {
    const event = eventType.toLowerCase();
    const text = String(payload.text ?? payload.message ?? "").trim().toUpperCase();
    return event.includes("opt_out") || event.includes("unsubscribe") || ["STOP", "UNSUBSCRIBE", "CANCEL"].includes(text);
  }
}
