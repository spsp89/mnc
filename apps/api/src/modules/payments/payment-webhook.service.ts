import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";

export const PAYMENT_WEBHOOK_QUEUE = "payment-webhooks";

@Injectable()
export class PaymentWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(PAYMENT_WEBHOOK_QUEUE) private readonly queue: Queue,
  ) {}

  async accept(rawBody: Buffer, signature: string | undefined, eventId: string | undefined) {
    const secret = this.config.get<string>("RAZORPAY_WEBHOOK_SECRET");
    if (!secret || !signature || !eventId) throw new UnauthorizedException("Invalid webhook authentication.");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const receivedBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      throw new UnauthorizedException("Invalid webhook signature.");
    }
    let payload: { event?: string };
    try {
      payload = JSON.parse(rawBody.toString("utf8")) as { event?: string };
    } catch {
      throw new UnauthorizedException("Invalid webhook payload.");
    }
    if (!payload.event) throw new UnauthorizedException("Webhook event type is missing.");
    let event;
    try {
      event = await this.prisma.webhookEvent.create({
        data: {
          provider: "razorpay",
          eventId,
          eventType: payload.event,
          payloadHash: createHash("sha256").update(rawBody).digest("hex"),
          payload: payload as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (String(error).includes("Unique constraint")) {
        return { accepted: true, duplicate: true };
      }
      throw error;
    }
    await this.queue.add("process", { eventDatabaseId: event.id }, {
      jobId: `razorpay:${eventId}`,
      attempts: 8,
      backoff: { type: "exponential", delay: 1500 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
    return { accepted: true };
  }
}
