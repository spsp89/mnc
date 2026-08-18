import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateSubscriptionDto } from "./dto/create-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async plans() {
    const data = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { monthlyPrice: "asc" }],
    });
    return { data };
  }

  async current(userId: string, businessId: string) {
    await this.businessAccess.require(
      userId,
      businessId,
      "business:billing:manage",
    );
    const [subscriptions, products, galleryPhotos, categories, offers] = await Promise.all([
      this.prisma.businessSubscription.findMany({
        where: { businessId, status: { in: ["PENDING_PAYMENT", "TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] } },
        include: { plan: true, payments: { orderBy: { createdAt: "desc" }, take: 5 } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where: { businessId, deletedAt: null } }),
      this.prisma.businessMedia.count({ where: { businessId } }),
      this.prisma.businessCategory.count({ where: { businessId } }),
      this.prisma.offer.count({ where: { businessId, targetCustomerId: null } }),
    ]);
    const paymentStatus = (status?: string) => status === "CAPTURED" ? "paid"
      : status === "FAILED" ? "failed"
        : status === "REFUNDED" || status === "PARTIALLY_REFUNDED" ? "refunded"
          : status === "CANCELLED" ? "cancelled" : status ? "pending" : "not_applicable";
    return { data: subscriptions.map((subscription) => ({
      ...subscription,
      paymentStatus: paymentStatus(subscription.payments[0]?.status),
      usage: {
        leads: { used: subscription.leadCreditsUsed, limit: subscription.plan.leadQuota },
        products: { used: products, limit: subscription.plan.productLimit },
        media: { used: galleryPhotos, limit: subscription.plan.mediaLimit },
        categories: { used: categories, limit: subscription.plan.categoryLimit },
        offers: { used: offers, limit: subscription.plan.offerLimit },
      },
    })) };
  }

  async create(userId: string, input: CreateSubscriptionDto) {
    await this.businessAccess.require(
      userId,
      input.businessId,
      "business:billing:manage",
    );
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: input.planId, isActive: true },
    });
    if (!plan) throw new NotFoundException("Subscription plan not found.");
    const [products, galleryPhotos, categories, offers] = await Promise.all([
      this.prisma.product.count({ where: { businessId: input.businessId, deletedAt: null } }),
      this.prisma.businessMedia.count({ where: { businessId: input.businessId } }),
      this.prisma.businessCategory.count({ where: { businessId: input.businessId } }),
      this.prisma.offer.count({ where: { businessId: input.businessId, targetCustomerId: null } }),
    ]);
    const exceeded = [
      plan.productLimit !== null && products > plan.productLimit
        ? `${products} products (limit ${plan.productLimit})`
        : null,
      plan.mediaLimit !== null && galleryPhotos > plan.mediaLimit
        ? `${galleryPhotos} gallery photos (limit ${plan.mediaLimit})`
        : null,
      categories > plan.categoryLimit
        ? `${categories} categories (limit ${plan.categoryLimit})`
        : null,
      plan.offerLimit !== null && offers > plan.offerLimit
        ? `${offers} offers (limit ${plan.offerLimit})`
        : null,
    ].filter(Boolean);
    if (exceeded.length) {
      throw new ConflictException(
        `This business exceeds the ${plan.name} plan: ${exceeded.join(", ")}. Reduce usage before changing plans.`,
      );
    }
    const pending = await this.prisma.businessSubscription.findFirst({
      where: { businessId: input.businessId, planId: input.planId, status: "PENDING_PAYMENT" },
      select: { id: true },
    });
    if (pending) throw new ConflictException("A checkout for this plan is already pending.");

    const now = new Date();
    const periodEnd = new Date(now);
    if (input.billingCycle === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);
    const isFree = Number(input.billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice) === 0;

    const data = await this.prisma.$transaction(async (transaction) => {
      if (isFree) {
        await transaction.businessSubscription.updateMany({
          where: { businessId: input.businessId, status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] } },
          data: { status: "CANCELLED", cancelledAt: now },
        });
      }
      return transaction.businessSubscription.create({
        data: {
          businessId: input.businessId,
          planId: input.planId,
          status: isFree ? "ACTIVE" : "PENDING_PAYMENT",
          billingCycle: input.billingCycle,
          startsAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenew: false,
          renewalStatus: isFree ? "NOT_DUE" : "PAYMENT_PENDING",
          lastRenewedAt: isFree ? now : null,
          source: isFree ? "SELF_SERVICE" : "CHECKOUT",
        },
        include: { plan: true },
      });
    });
    return { data, checkoutRequired: !isFree };
  }

  async cancel(userId: string, id: string) {
    const subscription = await this.prisma.businessSubscription.findUnique({
      where: { id },
      select: { businessId: true, status: true },
    });
    if (!subscription) throw new NotFoundException("Subscription not found.");
    await this.businessAccess.require(
      userId,
      subscription.businessId,
      "business:billing:manage",
    );
    if (["CANCELLED", "EXPIRED"].includes(subscription.status)) {
      return { data: { cancelled: true } };
    }
    const cancelledAt = new Date();
    const update = {
      where: { id },
      data: {
        status: subscription.status === "PENDING_PAYMENT" ? "CANCELLED" as const : subscription.status,
        cancelledAt,
        autoRenew: false,
        renewalStatus: "CANCELLED",
      },
    };
    const data = subscription.status === "PENDING_PAYMENT"
      ? await this.prisma.$transaction(async (transaction) => {
          const cancellablePayments = await transaction.payment.findMany({
            where: { subscriptionId: id, status: { in: ["CREATED", "AUTHORIZED"] } },
            select: { id: true, status: true },
          });
          await Promise.all(cancellablePayments.map((payment) => transaction.payment.update({ where: { id: payment.id }, data: { status: "CANCELLED", statusHistory: { create: { previousStatus: payment.status, newStatus: "CANCELLED", source: "MERCHANT_CANCELLATION", actorId: userId, reason: "Pending subscription checkout cancelled by authenticated merchant" } } } })));
          return transaction.businessSubscription.update(update);
        })
      : await this.prisma.businessSubscription.update(update);
    return { data, message: subscription.status === "PENDING_PAYMENT" ? "Pending checkout cancelled." : "Renewal cancelled; access continues to the current period end." };
  }
}
