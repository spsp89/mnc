import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { ListProductsDto } from "./dto/list-products.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { MediaService } from "../media/media.service";
import { calculateDistanceKm, comparePlanRanking, resolveAdministrativeContext } from "../../common/location/local-discovery";
import { PlanEntitlementsService } from "../../common/subscriptions/plan-entitlements.service";

const normalizedDeliveryMode = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s-]+/g, "_")
    : "";

function hasCourierOption(value: unknown): boolean {
  if (normalizedDeliveryMode(value) === "courier") return true;
  if (Array.isArray(value)) return value.some(hasCourierOption);
  if (value === null || typeof value !== "object") return false;
  const option = value as Record<string, unknown>;
  return option.courier === true || [option.type, option.mode, option.value, option.method]
    .some((entry) => normalizedDeliveryMode(entry) === "courier");
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly mediaStorage: MediaService,
    private readonly planEntitlements: PlanEntitlementsService,
  ) {}

  async list(query: ListProductsDto) {
    const hasCoordinates =
      typeof query.latitude === "number" && typeof query.longitude === "number";
    const courierDiscovery = query.courier === true;
    const administrativeContext = await resolveAdministrativeContext(this.prisma, {
      latitude: query.latitude,
      longitude: query.longitude,
      constituency: query.constituency,
      district: query.district,
      state: query.state,
    });
    const where = {
      isActive: true,
      status: "PUBLISHED" as const,
      deletedAt: null,
      business: {
        status: "ACTIVE" as const,
        listingStatus: "PUBLISHED" as const,
        deletedAt: null,
        ...(query.city && !hasCoordinates ? { locations: { some: {
          isActive: true,
          OR: ["locality", "city", "constituency", "district", "state"].map((field) => ({
            [field]: { equals: query.city, mode: "insensitive" as const },
          })),
        } } } : {}),
      },
      ...(query.category ? { category: { OR: [
        { slug: query.category },
        { parent: { is: { slug: query.category } } },
        { parent: { is: { parent: { is: { slug: query.category } } } } },
      ] } } : {}),
      ...(query.stock ? { stockStatus: query.stock } : {}),
      ...(query.q ? { OR: [
        { name: { contains: query.q, mode: "insensitive" as const } },
        { brand: { contains: query.q, mode: "insensitive" as const } },
        { description: { contains: query.q, mode: "insensitive" as const } },
      ] } : {}),
    };
    const candidates = await this.prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              verified: true,
              locations: {
                where: { isPrimary: true, isActive: true },
                take: 1,
                select: { locality: true, city: true, constituency: true, district: true, state: true, latitude: true, longitude: true },
              },
              subscriptions: {
                where: {
                  status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
                  currentPeriodEnd: { gte: new Date() },
                },
                orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
                take: 1,
                select: {
                  startsAt: true,
                  plan: { select: { name: true, priority: true, starLevel: true, listingReach: true, deliveryEnabled: true, sponsoredPlacement: true } },
                },
              },
            },
          },
          variants: { where: { isActive: true }, take: 10 },
          media: { where: { scanStatus: "approved" }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
    const sales = query.sort === "best-selling" && candidates.length
      ? await this.prisma.orderItem.groupBy({
          by: ["productId"],
          where: {
            productId: { in: candidates.map((product) => product.id) },
            order: {
              status: { in: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "DISPATCHED", "DELIVERED"] },
            },
          },
          _sum: { quantity: true },
        })
      : [];
    const unitsSoldByProduct = new Map(
      sales.map((sale) => [sale.productId, sale._sum.quantity ?? 0]),
    );
    const ranked = candidates
      .map((product) => {
        const location = product.business.locations[0];
        const distanceKm = hasCoordinates && location
          ? calculateDistanceKm(
              query.latitude!,
              query.longitude!,
              Number(location.latitude),
              Number(location.longitude),
            )
          : undefined;
        const subscription = product.business.subscriptions[0];
        const courierAvailable = Boolean(subscription?.plan.deliveryEnabled) &&
          hasCourierOption(product.deliveryOptions);
        const unitsSold = unitsSoldByProduct.get(product.id) ?? 0;
        const textLocationMatch = Boolean(query.city) && [
          location?.locality,
          location?.city,
          location?.constituency,
          location?.district,
          location?.state,
        ].some((value) => value?.toLowerCase() === query.city?.toLowerCase());
        const hasLocationConstraint = hasCoordinates || Boolean(
          query.city || query.constituency || query.district || query.state,
        );
        return {
          ...product,
          deliveryOptions: subscription?.plan.deliveryEnabled
            ? product.deliveryOptions
            : [],
          distanceKm,
          bncStarLevel: subscription?.plan.starLevel ?? 0,
          planName: subscription?.plan.name,
          sponsored: subscription?.plan.sponsoredPlacement ?? false,
          courierAvailable,
          unitsSold,
          listingReach: subscription?.plan.listingReach ?? "NEARBY_5KM",
          planPriority: subscription?.plan.priority ?? 0,
          planStartedAt: subscription?.startsAt,
          withinSelectedArea: courierDiscovery
            ? courierAvailable && (query.sort !== "best-selling" || unitsSold > 0)
            : hasCoordinates
            ? distanceKm !== undefined && distanceKm <= query.radiusKm
            : !hasLocationConstraint || textLocationMatch || (
                subscription?.plan.listingReach === "CONSTITUENCY" &&
                Boolean(administrativeContext.constituency || query.city) &&
                (location?.constituency ?? location?.city ?? "").toLowerCase() === (administrativeContext.constituency ?? query.city ?? "").toLowerCase()
              ) || (
                ["DISTRICT", "STATE"].includes(subscription?.plan.listingReach ?? "") &&
                Boolean(administrativeContext.district || query.city) &&
                location?.district?.toLowerCase() === (administrativeContext.district ?? query.city)?.toLowerCase()
              ) || (
                subscription?.plan.listingReach === "STATE" &&
                Boolean(administrativeContext.state || query.city) &&
                location?.state?.toLowerCase() === (administrativeContext.state ?? query.city)?.toLowerCase()
              ),
        };
      })
      .filter((product) => product.withinSelectedArea)
      .sort((left, right) => {
        const recommended = () => comparePlanRanking(
          { priority: left.planPriority, startsAt: left.planStartedAt },
          { priority: right.planPriority, startsAt: right.planStartedAt },
        ) ||
          (left.distanceKm ?? Number.MAX_SAFE_INTEGER) -
            (right.distanceKm ?? Number.MAX_SAFE_INTEGER) ||
          right.createdAt.getTime() - left.createdAt.getTime();
        const planTieBreak = () => comparePlanRanking(
          { priority: left.planPriority, startsAt: left.planStartedAt },
          { priority: right.planPriority, startsAt: right.planStartedAt },
        ) || right.createdAt.getTime() - left.createdAt.getTime();
        const leftLocation = left.business.locations[0];
        const rightLocation = right.business.locations[0];
        const leftPrice = Number(left.discountPrice ?? left.price);
        const rightPrice = Number(right.discountPrice ?? right.price);
        const stockOrder = { IN_STOCK: 0, LOW_STOCK: 1, MADE_TO_ORDER: 2, OUT_OF_STOCK: 3 } as const;

        switch (query.sort) {
          case "best-selling":
            return right.unitsSold - left.unitsSold || recommended();
          case "nearest":
            return (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER) || planTieBreak();
          case "newest":
            return right.createdAt.getTime() - left.createdAt.getTime() || planTieBreak();
          case "price-low":
            return leftPrice - rightPrice || planTieBreak();
          case "price-high":
            return rightPrice - leftPrice || planTieBreak();
          case "name":
            return left.name.localeCompare(right.name) || planTieBreak();
          case "category":
            return left.category.name.localeCompare(right.category.name) || left.name.localeCompare(right.name);
          case "location":
            return `${leftLocation?.city ?? ""} ${leftLocation?.locality ?? ""}`.localeCompare(`${rightLocation?.city ?? ""} ${rightLocation?.locality ?? ""}`) || planTieBreak();
          case "status":
            return stockOrder[left.stockStatus] - stockOrder[right.stockStatus] || planTieBreak();
          default:
            return recommended();
        }
      });
    const skip = (query.page - 1) * query.pageSize;
    return {
      data: ranked.slice(skip, skip + query.pageSize),
      meta: { page: query.page, pageSize: query.pageSize, radiusKm: query.radiusKm, total: ranked.length },
    };
  }

  async find(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: "PUBLISHED",
        isActive: true,
        deletedAt: null,
        business: { status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null },
      },
      include: {
        category: true,
        business: { select: {
          id: true,
          name: true,
          slug: true,
          verified: true,
          publicPhone: true,
          locations: { where: { isActive: true } },
          subscriptions: {
            where: {
              status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
              currentPeriodEnd: { gte: new Date() },
            },
            orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
            take: 1,
            select: { plan: { select: { deliveryEnabled: true } } },
          },
        } },
        variants: { where: { isActive: true } },
        offers: {
          where: { offer: { targetCustomerId: null, isActive: true, moderationStatus: "APPROVED", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } } },
          include: { offer: true },
        },
        media: { where: { scanStatus: "approved" }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new NotFoundException("Product not found.");
    return {
      data: {
        ...product,
        deliveryOptions: product.business.subscriptions[0]?.plan.deliveryEnabled
          ? product.deliveryOptions
          : [],
      },
    };
  }

  async create(userId: string, input: CreateProductDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    await this.requireBusinessCategory(input.businessId, input.categoryId);
    if (input.deliveryOptions?.some((option) => option !== "pickup")) {
      await this.planEntitlements.requireFeature(input.businessId, "deliveryEnabled");
    }
    if (input.media?.length) {
      await this.mediaStorage.requireOwnedObjects(
        userId,
        "product_image",
        input.businessId,
        input.media.map((item) => item.objectKey),
      );
    }
    if (input.discountPrice !== undefined && input.discountPrice > input.price) {
      throw new BadRequestException("Discount price cannot exceed the regular price.");
    }
    const product = await this.planEntitlements.withProductCapacity(input.businessId, (transaction) => transaction.product.create({
      data: {
        businessId: input.businessId,
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        brand: input.brand,
        description: input.description,
        price: input.price,
        discountPrice: input.discountPrice,
        stockStatus: input.stockStatus ?? "IN_STOCK",
        minimumOrderQty: input.minimumOrderQty ?? 1,
        deliveryOptions: input.deliveryOptions as Prisma.InputJsonValue | undefined,
        specifications: input.specifications as Prisma.InputJsonValue | undefined,
        warranty: input.warranty,
        returnInformation: input.returnInformation,
        status: "DRAFT",
        isActive: false,
        media: input.media ? {
          create: input.media.map((item) => ({
            objectKey: item.objectKey,
            mediaType: item.mediaType,
            altText: item.altText,
            sortOrder: item.sortOrder ?? 0,
            variant: item.variant ?? "gallery",
            width: item.width,
            height: item.height,
          })),
        } : undefined,
      },
    }));
    return { data: product };
  }

  async update(userId: string, id: string, input: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { businessId: true, price: true, status: true },
    });
    if (!product) throw new NotFoundException("Product not found.");
    await this.businessAccess.require(userId, product.businessId, "business:catalog:manage");
    if (input.categoryId) {
      await this.requireBusinessCategory(product.businessId, input.categoryId);
    }
    if (input.deliveryOptions?.some((option) => option !== "pickup")) {
      await this.planEntitlements.requireFeature(product.businessId, "deliveryEnabled");
    }
    if (input.media?.length) {
      await this.mediaStorage.requireOwnedObjects(
        userId,
        "product_image",
        product.businessId,
        input.media.map((item) => item.objectKey),
      );
    }
    if (!["DRAFT", "REJECTED", "PUBLISHED"].includes(product.status)) {
      throw new BadRequestException(
        "Products under review or already archived cannot be edited.",
      );
    }
    const effectivePrice = input.price ?? Number(product.price);
    if (input.discountPrice != null && input.discountPrice > effectivePrice) {
      throw new BadRequestException("Discount price cannot exceed the regular price.");
    }
    const { media, ...fields } = input;
    const data: Prisma.ProductUncheckedUpdateInput = {
      ...fields,
      deliveryOptions: input.deliveryOptions as Prisma.InputJsonValue | undefined,
      specifications: input.specifications as Prisma.InputJsonValue | undefined,
      ...(product.status === "PUBLISHED" && media !== undefined
        ? {
            status: "SUBMITTED",
            isActive: false,
            submittedAt: new Date(),
            moderationReason: null,
          }
        : {}),
    };
    const updated = await this.prisma.$transaction(async (transaction) => {
      await transaction.product.update({ where: { id }, data });
      if (media) {
        await transaction.productMedia.deleteMany({ where: { productId: id } });
        if (media.length) {
          await transaction.productMedia.createMany({
            data: media.map((item) => ({
              productId: id,
              objectKey: item.objectKey,
              mediaType: item.mediaType,
              altText: item.altText,
              sortOrder: item.sortOrder ?? 0,
              variant: item.variant ?? "gallery",
              width: item.width,
              height: item.height,
            })),
          });
        }
      }
      return transaction.product.findUniqueOrThrow({ where: { id }, include: { media: true } });
    });
    return { data: updated };
  }

  private async requireBusinessCategory(businessId: string, categoryId: string) {
    const category = await this.prisma.businessCategory.findUnique({
      where: { businessId_categoryId: { businessId, categoryId } },
      select: { categoryId: true },
    });
    if (!category) {
      throw new BadRequestException(
        "Add this category to the business profile before publishing products in it.",
      );
    }
  }

  async manage(userId: string, businessId: string) {
    if (!businessId) throw new BadRequestException("businessId is required.");
    await this.businessAccess.require(userId, businessId, "business:view");
    const [data, categories, plan] = await Promise.all([
      this.prisma.product.findMany({
        where: { businessId, deletedAt: null },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.businessCategory.findMany({
        where: { businessId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        select: { category: { select: { id: true, name: true, slug: true } } },
      }),
      this.planEntitlements.activePlan(businessId),
    ]);
    const usage = plan ? await this.planEntitlements.usage(businessId) : null;
    return {
      data,
      categories: categories.map((item) => item.category),
      usage,
    };
  }

  async submit(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        businessId: true,
        status: true,
        name: true,
        description: true,
        price: true,
        categoryId: true,
      },
    });
    if (!product) throw new NotFoundException("Product not found.");
    await this.businessAccess.require(userId, product.businessId, "business:catalog:manage");
    await this.businessAccess.requireApprovedForPublication(product.businessId);
    if (!["DRAFT", "REJECTED"].includes(product.status)) {
      throw new BadRequestException("Only draft or rejected products can be submitted.");
    }
    if (
      product.name.trim().length < 2 ||
      product.description.trim().length < 10 ||
      Number(product.price) < 0 ||
      !product.categoryId
    ) {
      throw new BadRequestException("Complete the required product details before submission.");
    }
    const data = await this.prisma.product.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        moderationReason: null,
        isActive: false,
      },
    });
    return { data };
  }

  async archive(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { businessId: true } });
    if (!product) throw new NotFoundException("Product not found.");
    await this.businessAccess.require(userId, product.businessId, "business:catalog:manage");
    await this.prisma.product.update({
      where: { id },
      data: { status: "ARCHIVED", isActive: false, deletedAt: new Date() },
    });
    return { data: { archived: true } };
  }
}
