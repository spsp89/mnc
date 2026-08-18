import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { z } from "zod";
import { PrismaService } from "../../database/prisma.service";
import { PAYMENT_WEBHOOK_QUEUE } from "./payment-webhook.service";

const paymentEventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        status: z.string(),
        amount: z.number().int().nonnegative(),
        currency: z.string(),
        notes: z.record(z.string(), z.unknown()).optional(),
      }),
    }).optional(),
    refund: z.object({
      entity: z.object({
        id: z.string(),
        payment_id: z.string(),
        status: z.string(),
        amount: z.number().int().nonnegative(),
        currency: z.string().optional(),
        receipt: z.string().nullable().optional(),
        notes: z.record(z.string(), z.unknown()).optional(),
      }),
    }).optional(),
  }),
});

@Processor(PAYMENT_WEBHOOK_QUEUE, { concurrency: 8 })
export class PaymentWebhookProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ eventDatabaseId: string }>) {
    const event = await this.prisma.webhookEvent.findUnique({ where: { id: job.data.eventDatabaseId } });
    if (!event || event.status === "PROCESSED" || event.status === "IGNORED") return;
    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSING", attempts: { increment: 1 }, error: null },
    });
    try {
      const parsed = paymentEventSchema.safeParse(event.payload);
      if (!parsed.success) {
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date() } });
        return;
      }
      const webhook = parsed.data;
      const refundEntity = webhook.payload.refund?.entity;
      if (refundEntity && ["refund.processed", "refund.failed"].includes(webhook.event)) {
        const internalRefundId = typeof refundEntity.notes?.bnc_refund_id === "string"
          ? refundEntity.notes.bnc_refund_id
          : refundEntity.receipt || undefined;
        const refund = internalRefundId
          ? await this.prisma.refund.findUnique({ where: { id: internalRefundId }, include: { payment: true } })
          : await this.prisma.refund.findUnique({ where: { providerRefundId: refundEntity.id }, include: { payment: true } });
        if (!refund) {
          await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date(), error: "No matching refund." } });
          return;
        }
        if (refund.payment.providerPaymentId !== refundEntity.payment_id || Math.round(Number(refund.amount) * 100) !== refundEntity.amount) {
          throw new Error("Webhook refund payment or amount does not match the refund record.");
        }
        await this.prisma.$transaction(async (transaction) => {
          if (webhook.event === "refund.processed") {
            await transaction.refund.update({ where: { id: refund.id }, data: {
              status: "COMPLETED", providerRefundId: refundEntity.id, completedAt: new Date(), failureReason: null,
              metadata: { providerStatus: refundEntity.status, webhookEventId: event.eventId },
            } });
            const completed = await transaction.refund.aggregate({
              where: { paymentId: refund.paymentId, status: "COMPLETED" },
              _sum: { amount: true },
            });
            const paymentStatus = Number(completed._sum.amount ?? 0) >= Number(refund.payment.amount) - 0.005 ? "REFUNDED" : "PARTIALLY_REFUNDED";
            if (refund.payment.status !== paymentStatus) await transaction.payment.update({ where: { id: refund.paymentId }, data: {
              status: paymentStatus,
              statusHistory: { create: { previousStatus: refund.payment.status, newStatus: paymentStatus, source: "RAZORPAY_WEBHOOK", sourceReference: event.eventId, reason: webhook.event, metadata: { refundId: refund.id, providerRefundId: refundEntity.id } } },
            } });
          } else {
            await transaction.refund.update({ where: { id: refund.id }, data: {
              status: "REJECTED", providerRefundId: refundEntity.id, failureReason: "Razorpay reported that the refund failed.",
              metadata: { providerStatus: refundEntity.status, webhookEventId: event.eventId },
            } });
          }
          await transaction.webhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
        });
        return;
      }
      const entity = webhook.payload.payment?.entity;
      if (!entity || !["payment.authorized", "payment.captured", "payment.failed"].includes(webhook.event)) {
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date() } });
        return;
      }
      const bncPaymentId = typeof entity.notes?.bnc_payment_id === "string" ? entity.notes.bnc_payment_id : undefined;
      const payment = bncPaymentId
        ? await this.prisma.payment.findUnique({ where: { id: bncPaymentId } })
        : await this.prisma.payment.findFirst({
            where: { metadata: { path: ["providerOrderId"], equals: entity.order_id } },
          });
      if (!payment) {
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date(), error: "No matching payment." } });
        return;
      }
      if (Math.round(Number(payment.amount) * 100) !== entity.amount || payment.currency !== entity.currency) {
        throw new Error("Webhook amount or currency does not match the payment record.");
      }
      await this.prisma.$transaction(async (transaction) => {
        if (webhook.event === "payment.captured") {
          await transaction.payment.update({
            where: { id: payment.id },
            data: { status: "CAPTURED", providerPaymentId: entity.id, capturedAt: new Date(), failedAt: null, statusHistory: { create: { previousStatus: payment.status, newStatus: "CAPTURED", source: "RAZORPAY_WEBHOOK", sourceReference: event.eventId, reason: webhook.event } } },
          });
          if (payment.orderId) {
            await transaction.order.updateMany({
              where: { id: payment.orderId, status: "PENDING" },
              data: { status: "CONFIRMED", confirmedAt: new Date() },
            });
            const order = await transaction.order.findUnique({ where: { id: payment.orderId }, select: { customerId: true, orderNumber: true } });
            if (order) await transaction.notification.create({
              data: {
                userId: order.customerId,
                type: "PAYMENT_CONFIRMATION",
                channel: "IN_APP",
                title: "Payment confirmed",
                body: `Payment for order ${order.orderNumber} was captured successfully.`,
                data: { orderId: payment.orderId, paymentId: payment.id },
                sentAt: new Date(),
              },
            });
          }
          if (payment.subscriptionId) {
            const subscription = await transaction.businessSubscription.findUnique({
              where: { id: payment.subscriptionId },
              select: { id: true, businessId: true, planId: true, billingCycle: true, business: { select: { owner: { select: { userId: true } } } }, plan: { select: { name: true } } },
            });
            if (subscription) {
              const previous = await transaction.businessSubscription.findFirst({
                where: { businessId: subscription.businessId, id: { not: subscription.id }, status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] } },
                orderBy: { currentPeriodEnd: "desc" },
                select: { planId: true, currentPeriodEnd: true },
              });
              await transaction.businessSubscription.updateMany({
                where: { businessId: subscription.businessId, id: { not: subscription.id }, status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] } },
                data: { status: "CANCELLED", cancelledAt: new Date(), autoRenew: false, renewalStatus: "CANCELLED" },
              });
              const activatedAt = new Date();
              const renewalBase = previous?.planId === subscription.planId && previous.currentPeriodEnd > activatedAt
                ? previous.currentPeriodEnd
                : activatedAt;
              const periodEnd = new Date(renewalBase);
              if (subscription.billingCycle === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
              else periodEnd.setMonth(periodEnd.getMonth() + 1);
              await transaction.businessSubscription.update({ where: { id: subscription.id }, data: {
                status: "ACTIVE", startsAt: activatedAt, currentPeriodStart: activatedAt, currentPeriodEnd: periodEnd,
                autoRenew: false, renewalStatus: "NOT_DUE", lastRenewedAt: activatedAt,
              } });
              await transaction.notification.create({
                data: {
                  userId: subscription.business.owner.userId,
                  type: "PAYMENT_CONFIRMATION",
                  channel: "IN_APP",
                  title: `${subscription.plan.name} plan activated`,
                  body: "Subscription payment was captured and plan access is active.",
                  data: { subscriptionId: subscription.id, paymentId: payment.id },
                  sentAt: new Date(),
                },
              });
            }
          }
        } else if (webhook.event === "payment.authorized" && payment.status === "CREATED") {
          await transaction.payment.update({ where: { id: payment.id }, data: { status: "AUTHORIZED", providerPaymentId: entity.id, statusHistory: { create: { previousStatus: payment.status, newStatus: "AUTHORIZED", source: "RAZORPAY_WEBHOOK", sourceReference: event.eventId, reason: webhook.event } } } });
        } else if (webhook.event === "payment.failed" && !["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"].includes(payment.status)) {
          await transaction.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerPaymentId: entity.id, failedAt: new Date(), statusHistory: { create: { previousStatus: payment.status, newStatus: "FAILED", source: "RAZORPAY_WEBHOOK", sourceReference: event.eventId, reason: webhook.event } } } });
          if (payment.subscriptionId) await transaction.businessSubscription.updateMany({
            where: { id: payment.subscriptionId, status: "PENDING_PAYMENT" },
            data: { renewalStatus: "FAILED" },
          });
        }
        await transaction.webhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
      });
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook processing error" },
      });
      throw error;
    }
  }
}
