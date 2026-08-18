import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import type { Job, Queue } from "bullmq";
import { PrismaService } from "../../database/prisma.service";
import { FirebasePushService } from "./firebase-push.service";

export const PUSH_DISPATCH_QUEUE = "push-dispatch";

@Injectable()
@Processor(PUSH_DISPATCH_QUEUE)
export class PushDispatchProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebasePushService,
    @InjectQueue(PUSH_DISPATCH_QUEUE)
    private readonly queue: Queue<Record<string, never>>,
  ) {
    super();
  }

  async onModuleInit() {
    if (process.env.DISABLE_BACKGROUND_JOBS === "true") return;
    await this.queue.upsertJobScheduler(
      "push-dispatch-sweep",
      { every: 60_000 },
      {
        name: "dispatch-pending-push",
        data: {},
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      },
    );
  }

  async process(job: Job<Record<string, never>>) {
    if (job.name !== "dispatch-pending-push") return { ignored: true };
    return this.dispatchPending();
  }

  async dispatchPending() {
    if (!this.firebase.configured) return { configured: false, sent: 0 };
    const notifications = await this.prisma.notification.findMany({
      where: {
        channel: "IN_APP",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60_000) },
        user: { pushDevices: { some: { active: true } } },
      },
      include: {
        user: {
          select: {
            pushDevices: {
              where: { active: true },
              select: { id: true, token: true },
              take: 10,
            },
          },
        },
        pushDeliveries: { select: { deviceId: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    const preferences = notifications.length
      ? await this.prisma.notificationPreference.findMany({
          where: {
            userId: { in: [...new Set(notifications.map((item) => item.userId))] },
            type: { in: [...new Set(notifications.map((item) => item.type))] },
          },
          select: { userId: true, type: true, push: true },
        })
      : [];
    const disabled = new Set(
      preferences
        .filter((preference) => !preference.push)
        .map((preference) => `${preference.userId}:${preference.type}`),
    );
    let sent = 0;
    let failed = 0;
    for (const notification of notifications) {
      if (disabled.has(`${notification.userId}:${notification.type}`)) continue;
      const delivered = new Set(
        notification.pushDeliveries
          .filter((delivery) => delivery.status === "SENT")
          .map((delivery) => delivery.deviceId),
      );
      for (const device of notification.user.pushDevices) {
        if (delivered.has(device.id)) continue;
        const attemptedAt = new Date();
        try {
          const providerMessageId = await this.firebase.send({
            token: device.token,
            title: notification.title,
            body: notification.body,
            data: this.stringData({
              notificationId: notification.id,
              type: notification.type,
              ...(notification.data && typeof notification.data === "object"
                ? notification.data as Record<string, unknown>
                : {}),
            }),
          });
          await this.prisma.pushDelivery.upsert({
            where: {
              notificationId_deviceId: {
                notificationId: notification.id,
                deviceId: device.id,
              },
            },
            create: {
              notificationId: notification.id,
              deviceId: device.id,
              status: "SENT",
              providerMessageId,
              attemptedAt,
              sentAt: attemptedAt,
            },
            update: {
              status: "SENT",
              providerMessageId,
              error: null,
              attemptedAt,
              sentAt: attemptedAt,
            },
          });
          sent += 1;
        } catch (error) {
          const reason = error instanceof Error ? error.message.slice(0, 500) : "Push delivery failed.";
          await this.prisma.pushDelivery.upsert({
            where: {
              notificationId_deviceId: {
                notificationId: notification.id,
                deviceId: device.id,
              },
            },
            create: {
              notificationId: notification.id,
              deviceId: device.id,
              status: "FAILED",
              error: reason,
              attemptedAt,
            },
            update: { status: "FAILED", error: reason, attemptedAt },
          });
          if (
            reason.includes("registration-token-not-registered")
            || reason.includes("invalid-registration-token")
          ) {
            await this.prisma.pushDevice.update({
              where: { id: device.id },
              data: { active: false },
            });
          }
          failed += 1;
        }
      }
    }
    return { configured: true, sent, failed };
  }

  private stringData(data: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        ]),
    );
  }
}
