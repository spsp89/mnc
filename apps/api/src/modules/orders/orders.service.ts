import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import type { CreateOrderDto } from "./dto/create-order.dto";
import type { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "DISPATCHED", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async create(customerId: string, input: CreateOrderDto) {
    if (input.fulfilmentType === "delivery" && !input.deliveryAddress) {
      throw new BadRequestException("Delivery address is required for delivery orders.");
    }
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        businessId: input.businessId,
        status: "PUBLISHED",
        isActive: true,
        deletedAt: null,
        stockStatus: { not: "OUT_OF_STOCK" },
        business: { status: "ACTIVE", deletedAt: null },
      },
      include: { variants: { where: { isActive: true } } },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException("One or more products are unavailable from this business.");
    }

    const itemData = input.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new BadRequestException("Product is unavailable.");
      const variant = item.variantId
        ? product.variants.find((candidate) => candidate.id === item.variantId)
        : undefined;
      if (item.variantId && !variant) throw new BadRequestException("Selected product variant is unavailable.");
      if (variant && variant.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${product.name}.`);
      const unitPaise = Math.round(Number(variant?.price ?? product.discountPrice ?? product.price) * 100);
      return {
        productId: product.id,
        variantId: variant?.id,
        nameSnapshot: variant ? `${product.name} · ${variant.name}` : product.name,
        skuSnapshot: variant?.sku,
        quantity: item.quantity,
        unitPrice: unitPaise / 100,
        total: (unitPaise * item.quantity) / 100,
      };
    });
    const subtotalPaise = itemData.reduce((sum, item) => sum + Math.round(item.total * 100), 0);
    const now = new Date();
    const offer = input.couponCode
      ? await this.prisma.offer.findFirst({
          where: {
            businessId: input.businessId,
            couponCode: { equals: input.couponCode.trim(), mode: "insensitive" },
            OR: [{ targetCustomerId: null }, { targetCustomerId: customerId }],
            isActive: true,
            moderationStatus: "APPROVED",
            startsAt: { lte: now },
            endsAt: { gte: now },
          },
          include: {
            products: { select: { productId: true } },
            services: { select: { serviceId: true } },
          },
        })
      : null;
    if (input.couponCode && !offer) throw new BadRequestException("Coupon is invalid or expired.");
    if (offer?.minimumSpend && subtotalPaise < Math.round(Number(offer.minimumSpend) * 100)) {
      throw new BadRequestException(`Coupon requires a minimum spend of ₹${Number(offer.minimumSpend).toFixed(0)}.`);
    }
    if (offer?.maxRedemptions !== null && offer && offer.redemptionCount >= offer.maxRedemptions) {
      throw new BadRequestException("Coupon redemption limit has been reached.");
    }
    if (offer && offer.products.length === 0 && offer.services.length > 0) {
      throw new BadRequestException("Coupon is only valid for the selected services.");
    }
    const eligibleProductIds = new Set(offer?.products.map((item) => item.productId) ?? []);
    const eligiblePaise = offer && eligibleProductIds.size
      ? itemData
          .filter((item) => eligibleProductIds.has(item.productId))
          .reduce((sum, item) => sum + Math.round(item.total * 100), 0)
      : subtotalPaise;
    const discountValue = Number(offer?.discountValue ?? 0);
    const discountPaise = offer
      ? Math.min(
          eligiblePaise,
          offer.type === "PERCENTAGE"
            ? Math.round(eligiblePaise * Math.min(100, Math.max(0, discountValue)) / 100)
            : Math.round(Math.max(0, discountValue) * 100),
        )
      : 0;
    const deliveryFeePaise = input.fulfilmentType === "delivery" ? 5000 : 0;
    const totalPaise = subtotalPaise - discountPaise + deliveryFeePaise;
    const orderNumber = `BNC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const data = await this.prisma.$transaction(async (transaction) => {
      if (offer) {
        const redemption = await transaction.offer.updateMany({
          where: {
            id: offer.id,
            isActive: true,
            endsAt: { gte: now },
            ...(offer.maxRedemptions === null ? {} : { redemptionCount: { lt: offer.maxRedemptions } }),
          },
          data: { redemptionCount: { increment: 1 } },
        });
        if (redemption.count !== 1) throw new BadRequestException("Coupon is no longer available.");
      }
      const order = await transaction.order.create({
        data: {
          orderNumber,
          customerId,
          businessId: input.businessId,
          fulfilmentType: input.fulfilmentType,
          deliveryAddress: input.deliveryAddress as Prisma.InputJsonValue | undefined,
          subtotal: subtotalPaise / 100,
          discount: discountPaise / 100,
          deliveryFee: deliveryFeePaise / 100,
          total: totalPaise / 100,
          notes: input.notes,
          items: { create: itemData },
        },
        include: { items: true, business: { select: { name: true, slug: true } } },
      });
      for (const item of itemData) {
        if (item.variantId) {
          const updated = await transaction.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count !== 1) throw new BadRequestException(`Stock changed for ${item.nameSnapshot}.`);
        }
      }
      return order;
    });
    return { data };
  }

  async cancel(customerId: string, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, customerId }, select: { id: true, status: true } });
    if (!order) throw new NotFoundException("Order not found.");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new BadRequestException("This order has already entered fulfilment and cannot be cancelled online.");
    }
    const data = await this.prisma.order.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    return { data };
  }

  async requestReturn(customerId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, customerId },
      select: { id: true, status: true, deliveredAt: true },
    });
    if (!order) throw new NotFoundException("Order not found.");
    if (order.status !== "DELIVERED" || !order.deliveredAt || order.deliveredAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      throw new BadRequestException("This order is not within the online return-request window.");
    }
    const data = await this.prisma.order.update({ where: { id }, data: { status: "RETURN_REQUESTED" } });
    return { data };
  }

  async listForCustomer(userId: string) {
    const data = await this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        business: { select: { name: true, slug: true, logoUrl: true } },
        items: true,
        payments: { select: { status: true, amount: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async listForBusiness(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:orders:manage");
    const data = await this.prisma.order.findMany({
      where: { businessId },
      include: {
        items: true,
        customer: { select: { id: true, customerProfile: { select: { displayName: true } } } },
        payments: { select: { status: true, amount: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async find(userId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        business: { select: { id: true, name: true, slug: true } },
        payments: true,
        refunds: true,
        review: { select: { id: true, status: true, overallRating: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found.");
    if (order.customerId !== userId) {
      await this.businessAccess.require(userId, order.businessId, "business:orders:manage");
    }
    const { business, ...safeOrder } = order;
    return { data: { ...safeOrder, business: { name: business.name, slug: business.slug } } };
  }

  async updateStatus(userId: string, id: string, input: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id }, select: { businessId: true, status: true } });
    if (!order) throw new NotFoundException("Order not found.");
    await this.businessAccess.require(userId, order.businessId, "business:orders:manage");
    if (!(transitions[order.status] ?? []).includes(input.status)) {
      throw new BadRequestException(`Order cannot move from ${order.status} to ${input.status}.`);
    }
    const now = new Date();
    const data = await this.prisma.order.update({
      where: { id },
      data: {
        status: input.status,
        confirmedAt: input.status === "CONFIRMED" ? now : undefined,
        deliveredAt: input.status === "DELIVERED" ? now : undefined,
        cancelledAt: input.status === "CANCELLED" ? now : undefined,
      },
    });
    return { data };
  }

}
