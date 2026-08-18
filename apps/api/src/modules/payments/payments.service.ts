import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import type { CreateCheckoutDto } from "./dto/create-checkout.dto";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async createCheckout(userId: string, input: CreateCheckoutDto) {
    if (Boolean(input.orderId) === Boolean(input.subscriptionId)) {
      throw new BadRequestException("Provide exactly one orderId or subscriptionId.");
    }
    const keyId = this.config.get<string>("RAZORPAY_KEY_ID");
    const keySecret = this.config.get<string>("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException("Razorpay checkout is not configured.");
    }
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return { data: this.checkoutResponse(existing, keyId), idempotent: true };

    const target = input.orderId
      ? await this.orderTarget(userId, input.orderId)
      : await this.subscriptionTarget(userId, input.subscriptionId!);
    let payment;
    try {
      payment = await this.prisma.payment.create({
        data: {
          orderId: input.orderId,
          subscriptionId: input.subscriptionId,
          provider: "razorpay",
          idempotencyKey: input.idempotencyKey,
          amount: target.amount,
          currency: "INR",
          metadata: { targetType: input.orderId ? "order" : "subscription" },
          statusHistory: { create: { newStatus: "CREATED", source: "CHECKOUT", actorId: userId, reason: "Checkout initiated by authenticated user" } },
        },
      });
    } catch (error) {
      if (String(error).includes("Unique constraint")) {
        const raced = await this.prisma.payment.findUniqueOrThrow({ where: { idempotencyKey: input.idempotencyKey } });
        return { data: this.checkoutResponse(raced, keyId), idempotent: true };
      }
      throw error;
    }

    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    try {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          authorization: `Basic ${authorization}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(target.amount * 100),
          currency: "INR",
          receipt: payment.id.slice(0, 40),
          notes: {
            bnc_payment_id: payment.id,
            target_type: input.orderId ? "order" : "subscription",
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const providerBody = await response.json() as RazorpayOrder & { error?: { description?: string } };
      if (!response.ok) {
        throw new Error(providerBody.error?.description ?? "Razorpay order creation failed.");
      }
      if (providerBody.amount !== Math.round(target.amount * 100) || providerBody.currency !== "INR") {
        throw new Error("Payment provider returned a mismatched amount or currency.");
      }
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            targetType: input.orderId ? "order" : "subscription",
            providerOrderId: providerBody.id,
            providerOrderStatus: providerBody.status,
          },
        },
      });
      return { data: this.checkoutResponse(updated, keyId) };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          metadata: { checkoutError: error instanceof Error ? error.message.slice(0, 300) : "Provider failure" },
          statusHistory: { create: { previousStatus: payment.status, newStatus: "FAILED", source: "CHECKOUT", actorId: userId, reason: "Provider order creation failed" } },
        },
      });
      throw new ServiceUnavailableException("Unable to create the payment order. Use a new checkout attempt.");
    }
  }

  async listForUser(userId: string) {
    const billingBusinessIds = await this.businessAccess.businessIdsFor(
      userId,
      "business:billing:manage",
    );
    const data = await this.prisma.payment.findMany({
      where: {
        OR: [
          { order: { customerId: userId } },
          { subscription: { businessId: { in: billingBusinessIds } } },
        ],
      },
      select: {
        id: true,
        orderId: true,
        subscriptionId: true,
        provider: true,
        amount: true,
        currency: true,
        status: true,
        capturedAt: true,
        failedAt: true,
        createdAt: true,
        refunds: { select: { id: true, amount: true, status: true, reason: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async listForBusiness(userId: string, businessId: string) {
    await this.businessAccess.require(
      userId,
      businessId,
      "business:billing:manage",
    );
    const [payments, settlements, captured] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: {
          OR: [
            { order: { businessId } },
            { subscription: { businessId } },
          ],
        },
        select: {
          id: true,
          provider: true,
          amount: true,
          currency: true,
          status: true,
          capturedAt: true,
          failedAt: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              fulfilmentType: true,
            },
          },
          subscription: {
            select: {
              id: true,
              billingCycle: true,
              plan: { select: { name: true } },
            },
          },
          refunds: {
            select: { id: true, amount: true, status: true, reason: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.settlement.findMany({
        where: { businessId },
        orderBy: { periodEnd: "desc" },
        take: 36,
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "CAPTURED",
          OR: [
            { order: { businessId } },
            { subscription: { businessId } },
          ],
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    return {
      data: {
        payments,
        settlements,
        summary: {
          capturedCount: captured._count._all,
          capturedAmount: captured._sum.amount ?? 0,
        },
      },
    };
  }

  private async orderTarget(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { where: { status: "CAPTURED" }, select: { id: true } } },
    });
    if (!order) throw new NotFoundException("Order not found.");
    if (order.customerId !== userId) throw new ForbiddenException("You cannot pay for this order.");
    if (order.status !== "PENDING" || order.payments.length) throw new BadRequestException("Order is not eligible for checkout.");
    return { amount: Number(order.total) };
  }

  private async subscriptionTarget(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.businessSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        business: { select: { id: true } },
        payments: { where: { status: "CAPTURED" }, select: { id: true } },
      },
    });
    if (!subscription) throw new NotFoundException("Subscription checkout not found.");
    await this.businessAccess.require(
      userId,
      subscription.business.id,
      "business:billing:manage",
    );
    if (subscription.status !== "PENDING_PAYMENT" || subscription.payments.length) {
      throw new BadRequestException("Subscription is not eligible for checkout.");
    }
    const amount = Number(subscription.billingCycle === "annual" ? subscription.plan.annualPrice : subscription.plan.monthlyPrice);
    if (amount <= 0) throw new BadRequestException("Free plans do not require payment checkout.");
    return { amount };
  }

  private checkoutResponse(payment: {
    id: string;
    amount: unknown;
    currency: string;
    status: string;
    metadata: unknown;
  }, keyId: string) {
    const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
    return {
      paymentId: payment.id,
      provider: "razorpay",
      providerOrderId: metadata.providerOrderId ?? null,
      keyId,
      amountSubunits: Math.round(Number(payment.amount) * 100),
      currency: payment.currency,
      status: payment.status,
    };
  }
}
