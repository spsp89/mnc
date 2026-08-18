import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Job, Queue } from "bullmq";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import { WhatsAppProviderService } from "./whatsapp-provider.service";

export const WHATSAPP_DISPATCH_QUEUE = "whatsapp-dispatch";
const CONSENT_TYPE = "WHATSAPP_NOTIFICATIONS";

@Injectable()
@Processor(WHATSAPP_DISPATCH_QUEUE)
export class WhatsAppDispatchProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: WhatsAppProviderService,
    private readonly config: ConfigService,
    @InjectQueue(WHATSAPP_DISPATCH_QUEUE) private readonly queue: Queue<Record<string, never>>,
  ) {
    super();
  }

  async onModuleInit() {
    if (process.env.DISABLE_BACKGROUND_JOBS === "true" || !this.provider.configured) return;
    await this.queue.upsertJobScheduler(
      "whatsapp-dispatch-sweep",
      { every: 60_000 },
      {
        name: "dispatch-approved-whatsapp",
        data: {},
        opts: { attempts: 3, backoff: { type: "exponential", delay: 5_000 }, removeOnComplete: 100, removeOnFail: 500 },
      },
    );
  }

  async process(job: Job<Record<string, never>>) {
    if (job.name !== "dispatch-approved-whatsapp") return { ignored: true };
    return this.dispatchPending();
  }

  async dispatchPending() {
    if (!this.provider.configured) return { configured: false, sent: 0 };
    const sources = await this.prisma.notification.findMany({
      where: {
        channel: "IN_APP",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60_000) },
        user: { phone: { not: null }, status: "ACTIVE", deletedAt: null },
      },
      include: { user: { select: { phone: true } } },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    if (!sources.length) return { configured: true, sent: 0, failed: 0, skipped: 0 };

    const userIds = [...new Set(sources.map((item) => item.userId))];
    const types = [...new Set(sources.map((item) => item.type))];
    const [preferences, consents, recent] = await Promise.all([
      this.prisma.notificationPreference.findMany({
        where: { userId: { in: userIds }, type: { in: types }, whatsapp: true },
        select: { userId: true, type: true },
      }),
      this.prisma.consent.findMany({
        where: { userId: { in: userIds }, type: CONSENT_TYPE },
        orderBy: { grantedAt: "desc" },
        select: { userId: true, granted: true, withdrawnAt: true, scope: true },
      }),
      this.prisma.notification.findMany({
        where: { channel: "WHATSAPP", sentAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) }, userId: { in: userIds } },
        select: { userId: true },
      }),
    ]);
    const enabled = new Set(preferences.map((item) => `${item.userId}:${item.type}`));
    const latestConsent = new Map<string, (typeof consents)[number]>();
    for (const consent of consents) if (!latestConsent.has(consent.userId)) latestConsent.set(consent.userId, consent);
    const dailyCount = new Map<string, number>();
    for (const notification of recent) dailyCount.set(notification.userId, (dailyCount.get(notification.userId) ?? 0) + 1);
    const dailyLimit = this.config.get<number>("WHATSAPP_DAILY_LIMIT", 3);

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    for (const source of sources) {
      const consent = latestConsent.get(source.userId);
      if (
        !enabled.has(`${source.userId}:${source.type}`)
        || !consent?.granted
        || consent.withdrawnAt
        || !this.scopeAllows(consent.scope, source.type)
        || !this.provider.templateFor(source.type)
        || !source.user.phone
        || (dailyCount.get(source.userId) ?? 0) >= dailyLimit
      ) {
        skipped += 1;
        continue;
      }
      const id = `whatsapp-${source.id}`;
      const existing = await this.prisma.notification.upsert({
        where: { id },
        create: {
          id,
          userId: source.userId,
          type: source.type,
          channel: "WHATSAPP",
          title: source.title,
          body: source.body,
          data: { sourceNotificationId: source.id, whatsappAttempts: 0 } as Prisma.InputJsonValue,
        },
        update: {},
      });
      const metadata = this.object(existing.data);
      const attempts = Number(metadata.whatsappAttempts ?? 0);
      if (existing.sentAt || attempts >= 3) {
        skipped += 1;
        continue;
      }
      try {
        const accepted = await this.provider.send({
          notificationId: id,
          to: source.user.phone,
          type: source.type,
          title: source.title,
          body: source.body,
        });
        await this.prisma.notification.update({
          where: { id },
          data: {
            sentAt: new Date(),
            failedAt: null,
            failure: null,
            data: { ...metadata, ...accepted, providerStatus: "ACCEPTED", whatsappAttempts: attempts + 1 } as Prisma.InputJsonValue,
          },
        });
        dailyCount.set(source.userId, (dailyCount.get(source.userId) ?? 0) + 1);
        sent += 1;
      } catch (error) {
        const failure = error instanceof Error ? error.message.slice(0, 500) : "WhatsApp delivery failed.";
        await this.prisma.notification.update({
          where: { id },
          data: {
            failedAt: new Date(),
            failure,
            data: { ...metadata, whatsappAttempts: attempts + 1 } as Prisma.InputJsonValue,
          },
        });
        failed += 1;
      }
    }
    return { configured: true, sent, failed, skipped };
  }

  private scopeAllows(scope: unknown, type: string) {
    const value = this.object(scope);
    if (value.all === true) return true;
    return Array.isArray(value.notificationTypes) && value.notificationTypes.includes(type);
  }

  private object(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
