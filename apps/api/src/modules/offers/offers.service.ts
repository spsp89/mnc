import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from "@nestjs/common";
import type { Queue } from "bullmq";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import { SubscriptionStatus } from "../../generated/prisma/enums";
import type { CreateOfferDto } from "./dto/create-offer.dto";
import type { ListOffersDto } from "./dto/list-offers.dto";
import type { UpdateOfferDto } from "./dto/update-offer.dto";
import { calculateDistanceKm } from "../../common/location/local-discovery";
import { PlanEntitlementsService } from "../../common/subscriptions/plan-entitlements.service";

export const OFFER_NOTIFICATION_QUEUE = "offer-notifications";

const notificationRelations = () => ({
  products: true,
  services: true,
  business: {
    select: {
      name: true,
      locations: {
        where: { isPrimary: true, isActive: true },
        take: 1,
        select: {
          latitude: true,
          longitude: true,
          city: true,
          district: true,
          state: true,
        },
      },
      subscriptions: {
        where: {
          status: {
            in: [
              SubscriptionStatus.TRIAL,
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.GRACE_PERIOD,
            ],
          },
          currentPeriodEnd: { gte: new Date() },
        },
        orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
        take: 1,
        select: { plan: { select: { offerReach: true } } },
      },
    },
  },
}) satisfies Prisma.OfferInclude;

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly planEntitlements: PlanEntitlementsService,
    @Optional()
    @InjectQueue(OFFER_NOTIFICATION_QUEUE)
    private readonly notificationQueue?: Queue<{ offerId: string }>,
  ) {}

  async list(query: ListOffersDto) {
    const now = new Date();
    const where = {
      targetCustomerId: null,
      isActive: true,
      moderationStatus: "APPROVED" as const,
      startsAt: { lte: now },
      endsAt: { gte: now },
      ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
      ...(query.q ? { OR: [
        { title: { contains: query.q, mode: "insensitive" as const } },
        { description: { contains: query.q, mode: "insensitive" as const } },
        { business: { name: { contains: query.q, mode: "insensitive" as const } } },
      ] } : {}),
      business: {
        status: "ACTIVE" as const,
        listingStatus: "PUBLISHED" as const,
        deletedAt: null,
        ...(query.city ? { locations: { some: { city: { equals: query.city, mode: "insensitive" as const }, isActive: true } } } : {}),
        ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
      },
    };
    const skip = (query.page - 1) * query.pageSize;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              verified: true,
              locations: { where: { isPrimary: true, isActive: true }, take: 1, select: { locality: true, city: true } },
            },
          },
          products: { include: { product: { select: { id: true, name: true, slug: true } } } },
          services: { include: { service: { select: { id: true, name: true, slug: true } } } },
        },
        orderBy: [{ isFeatured: "desc" }, { endsAt: "asc" }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.offer.count({ where }),
    ]);
    return { data, meta: { page: query.page, pageSize: query.pageSize, total } };
  }

  async mine(userId: string) {
    const now = new Date();
    const data = await this.prisma.offer.findMany({
      where: {
        targetCustomerId: userId,
        isActive: true,
        moderationStatus: "APPROVED",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            verified: true,
            coverImageUrl: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
              select: { locality: true, city: true },
            },
          },
        },
        products: { include: { product: { select: { id: true, name: true, slug: true } } } },
        services: { include: { service: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return { data };
  }

  async manage(userId: string, businessId: string) {
    if (!businessId) throw new BadRequestException("businessId is required.");
    await this.businessAccess.require(userId, businessId, "business:view");
    const [data, products, services] = await Promise.all([
      this.prisma.offer.findMany({
        where: { businessId, targetCustomerId: null },
        include: {
          products: {
            include: {
              product: { select: { id: true, name: true, status: true, stockStatus: true } },
            },
          },
          services: {
            include: {
              service: { select: { id: true, name: true, isActive: true } },
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { startsAt: "desc" }],
      }),
      this.prisma.product.findMany({
        where: { businessId, deletedAt: null, status: { not: "ARCHIVED" } },
        select: { id: true, name: true, status: true, stockStatus: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.service.findMany({
        where: { businessId, deletedAt: null },
        select: { id: true, name: true, isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { data, catalog: { products, services } };
  }

  async create(userId: string, input: CreateOfferDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("Offer end time must be after the start time.");
    if (input.type === "PERCENTAGE" && (input.discountValue == null || input.discountValue > 100)) {
      throw new BadRequestException("Percentage offers require a discount value from 0 to 100.");
    }
    const productIds = [...new Set(input.productIds ?? [])];
    const serviceIds = [...new Set(input.serviceIds ?? [])];
    await this.requireOwnedCatalog(input.businessId, productIds, serviceIds);
    const data = await this.planEntitlements.withOfferCapacity(input.businessId, (transaction) => transaction.offer.create({
      data: {
        businessId: input.businessId,
        title: input.title,
        description: input.description,
        type: input.type,
        discountValue: input.discountValue,
        couponCode: input.couponCode?.toUpperCase(),
        minimumSpend: input.minimumSpend,
        startsAt,
        endsAt,
        maxRedemptions: input.maxRedemptions,
        isFeatured: false,
        featuredRequested: input.isFeatured ?? false,
        moderationStatus: "PENDING",
        products: productIds.length ? { create: productIds.map((productId) => ({ productId })) } : undefined,
        services: serviceIds.length ? { create: serviceIds.map((serviceId) => ({ serviceId })) } : undefined,
      },
      include: notificationRelations(),
    }));
    // Moderation is authoritative: pending offers must never notify customers.
    // The minute sweep schedules/delivers only after an administrator approves it.
    return { data: { ...data, targetedCount: 0 } };
  }

  async update(userId: string, id: string, input: UpdateOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      select: { businessId: true, targetCustomerId: true, type: true, discountValue: true, startsAt: true, endsAt: true },
    });
    if (!offer) throw new NotFoundException("Offer not found.");
    if (offer.targetCustomerId) {
      throw new ForbiddenException("Customer-specific offers can only be managed by an administrator.");
    }
    await this.businessAccess.require(userId, offer.businessId, "business:catalog:manage");
    const startsAt = input.startsAt ? new Date(input.startsAt) : offer.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : offer.endsAt;
    if (endsAt <= startsAt) throw new BadRequestException("Offer end time must be after the start time.");
    const effectiveType = input.type ?? offer.type;
    const effectiveDiscountValue = input.discountValue === undefined
      ? offer.discountValue == null ? null : Number(offer.discountValue)
      : input.discountValue;
    if (
      effectiveType === "PERCENTAGE" &&
      (effectiveDiscountValue == null || effectiveDiscountValue > 100)
    ) {
      throw new BadRequestException("Percentage offers require a discount value from 0 to 100.");
    }
    const productIds = input.productIds ? [...new Set(input.productIds)] : undefined;
    const serviceIds = input.serviceIds ? [...new Set(input.serviceIds)] : undefined;
    await this.requireOwnedCatalog(offer.businessId, productIds ?? [], serviceIds ?? []);
    const fields = { ...input };
    delete fields.productIds;
    delete fields.serviceIds;
    delete fields.isFeatured;
    const data = await this.prisma.$transaction(async (transaction) => {
      await transaction.offer.update({
        where: { id },
        data: {
          ...fields,
          startsAt: input.startsAt ? startsAt : undefined,
          endsAt: input.endsAt ? endsAt : undefined,
          couponCode: input.couponCode === null ? null : input.couponCode?.toUpperCase(),
          featuredRequested: input.isFeatured,
          ...(input.startsAt || input.endsAt
            ? { notifiedAt: null, targetedCount: 0 }
            : {}),
          ...(input.title || input.description || input.type || input.discountValue !== undefined || input.couponCode !== undefined || input.minimumSpend !== undefined || input.startsAt || input.endsAt
            ? { moderationStatus: "PENDING", moderationReason: null, moderatedAt: null, moderatedById: null, notifiedAt: null, targetedCount: 0 }
            : {}),
        },
      });
      if (productIds) {
        await transaction.offerProduct.deleteMany({ where: { offerId: id } });
        if (productIds.length) {
          await transaction.offerProduct.createMany({
            data: productIds.map((productId) => ({ offerId: id, productId })),
          });
        }
      }
      if (serviceIds) {
        await transaction.offerService.deleteMany({ where: { offerId: id } });
        if (serviceIds.length) {
          await transaction.offerService.createMany({
            data: serviceIds.map((serviceId) => ({ offerId: id, serviceId })),
          });
        }
      }
      return transaction.offer.findUniqueOrThrow({
        where: { id },
        include: {
          products: { include: { product: { select: { id: true, name: true, status: true, stockStatus: true } } } },
          services: { include: { service: { select: { id: true, name: true, isActive: true } } } },
        },
      });
    });
    if (input.startsAt || input.endsAt) {
      if (startsAt <= new Date() && endsAt >= new Date()) {
        await this.deliverScheduled(id);
      } else if (startsAt > new Date()) {
        await this.scheduleNotification(id, startsAt);
      }
    }
    return { data };
  }

  private async requireOwnedCatalog(
    businessId: string,
    productIds: string[],
    serviceIds: string[],
  ) {
    const [productCount, serviceCount] = await Promise.all([
      productIds.length
        ? this.prisma.product.count({
            where: { id: { in: productIds }, businessId, deletedAt: null },
          })
        : Promise.resolve(0),
      serviceIds.length
        ? this.prisma.service.count({
            where: { id: { in: serviceIds }, businessId, deletedAt: null },
          })
        : Promise.resolve(0),
    ]);
    if (productCount !== productIds.length || serviceCount !== serviceIds.length) {
      throw new BadRequestException(
        "Offers can only include products and services owned by this business.",
      );
    }
  }

  async deliverScheduled(id: string) {
    const now = new Date();
    const offer = await this.prisma.offer.findFirst({
      where: {
        id,
        targetCustomerId: null,
        isActive: true,
        moderationStatus: "APPROVED",
        notifiedAt: null,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: notificationRelations(),
    });
    if (!offer) return { offerId: id, targetedCount: 0, skipped: true };
    const targetedCount = await this.notifyCustomers(offer);
    return { offerId: id, targetedCount, skipped: false };
  }

  async deliverDue() {
    const now = new Date();
    const due = await this.prisma.offer.findMany({
      where: {
        targetCustomerId: null,
        isActive: true,
        moderationStatus: "APPROVED",
        notifiedAt: null,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: notificationRelations(),
      orderBy: { startsAt: "asc" },
      take: 500,
    });
    let targetedCount = 0;
    for (const offer of due) {
      targetedCount += await this.notifyCustomers(offer);
    }
    return { delivered: due.length, targetedCount };
  }

  async notifyCustomers(offer: {
    id: string;
    title: string;
    startsAt: Date;
    business: {
      name: string;
      locations: Array<{
        latitude: unknown;
        longitude: unknown;
        city: string;
        district: string;
        state: string;
      }>;
      subscriptions: Array<{
        plan: { offerReach: "NEARBY_5KM" | "DISTRICT" | "STATE" };
      }>;
    };
  }) {
    const location = offer.business.locations[0];
    if (!location) return 0;
    const reach = offer.business.subscriptions[0]?.plan.offerReach ?? "NEARBY_5KM";
    const addresses = await this.prisma.savedAddress.findMany({
      where: reach === "STATE"
        ? { state: { equals: location.state, mode: "insensitive" } }
        : reach === "DISTRICT"
          ? {
              OR: [
                { district: { equals: location.district, mode: "insensitive" } },
                { city: { equals: location.city, mode: "insensitive" } },
              ],
            }
          : { latitude: { not: null }, longitude: { not: null } },
      select: { userId: true, latitude: true, longitude: true },
      take: 20_000,
    });
    const users = new Set(
      addresses
        .filter((address) => {
          if (reach !== "NEARBY_5KM") return true;
          if (address.latitude === null || address.longitude === null) return false;
          return calculateDistanceKm(
            Number(location.latitude),
            Number(location.longitude),
            Number(address.latitude),
            Number(address.longitude),
          ) <= 5;
        })
        .map((address) => address.userId),
    );
    const preferences = users.size
      ? await this.prisma.notificationPreference.findMany({
          where: { userId: { in: [...users] }, type: "NEARBY_OFFER" },
          select: { userId: true, inApp: true },
        })
      : [];
    const disabled = new Set(
      preferences.filter((preference) => !preference.inApp).map((preference) => preference.userId),
    );
    const recipients = [...users].filter((userId) => !disabled.has(userId));
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      if (recipients.length) {
        await transaction.notification.createMany({
          data: recipients.map((userId) => ({
            id: `nearby-offer-${offer.id}-${userId}`,
            userId,
            type: "NEARBY_OFFER",
            channel: "IN_APP",
            title: offer.startsAt > now ? "Upcoming local offer" : "New local offer",
            body: `${offer.business.name}: ${offer.title}`,
            data: { offerId: offer.id, reach },
            sentAt: now,
          })),
          skipDuplicates: true,
        });
      }
      await transaction.offer.update({
        where: { id: offer.id },
        data: { notifiedAt: now, targetedCount: recipients.length },
      });
    });
    return recipients.length;
  }

  private async scheduleNotification(offerId: string, startsAt: Date) {
    if (!this.notificationQueue) return 0;
    await this.notificationQueue.add(
      "deliver-offer-notification",
      { offerId },
      {
        jobId: `offer-notify-${offerId}-${startsAt.getTime()}`,
        delay: Math.max(0, startsAt.getTime() - Date.now()),
        attempts: 5,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
    return 0;
  }
}
