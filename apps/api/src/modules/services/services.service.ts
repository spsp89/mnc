import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import type { CreateServiceDto } from "./dto/create-service.dto";
import type { ListServicesDto } from "./dto/list-services.dto";
import type { UpdateServiceDto } from "./dto/update-service.dto";
import { MediaService } from "../media/media.service";
import { calculateDistanceKm, comparePlanRanking, resolveAdministrativeContext } from "../../common/location/local-discovery";
import { PlanEntitlementsService } from "../../common/subscriptions/plan-entitlements.service";

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly mediaStorage: MediaService,
    private readonly planEntitlements: PlanEntitlementsService,
  ) {}

  async list(query: ListServicesDto) {
    const hasCoordinates =
      typeof query.latitude === "number" && typeof query.longitude === "number";
    const topRatedDiscovery = query.sort === "top-rated";
    const administrativeContext = await resolveAdministrativeContext(this.prisma, {
      latitude: query.latitude,
      longitude: query.longitude,
      constituency: query.constituency,
      district: query.district,
      state: query.state,
    });
    const where = {
      isActive: true,
      deletedAt: null,
      ...(query.homeService === undefined ? {} : { homeService: query.homeService }),
      ...(query.category ? { category: { OR: [
        { slug: query.category },
        { parent: { is: { slug: query.category } } },
        { parent: { is: { parent: { is: { slug: query.category } } } } },
      ] } } : {}),
      ...(query.q ? { OR: [
        { name: { contains: query.q, mode: "insensitive" as const } },
        { description: { contains: query.q, mode: "insensitive" as const } },
      ] } : {}),
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
    };
    const candidates = await this.prisma.service.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              verified: true,
              averageRating: true,
              reviewCount: true,
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
                  plan: { select: { name: true, priority: true, starLevel: true, listingReach: true } },
                },
              },
            },
          },
          offers: {
            where: { offer: { targetCustomerId: null, isActive: true, moderationStatus: "APPROVED", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } } },
            include: { offer: true },
          },
          media: { where: { scanStatus: "approved" }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
    const ranked = candidates
      .map((service) => {
        const location = service.business.locations[0];
        const distanceKm = hasCoordinates && location
          ? calculateDistanceKm(
              query.latitude!,
              query.longitude!,
              Number(location.latitude),
              Number(location.longitude),
            )
          : undefined;
        const subscription = service.business.subscriptions[0];
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
          ...service,
          distanceKm,
          bncStarLevel: subscription?.plan.starLevel ?? 0,
          planName: subscription?.plan.name,
          listingReach: subscription?.plan.listingReach ?? "NEARBY_5KM",
          planPriority: subscription?.plan.priority ?? 0,
          planStartedAt: subscription?.startsAt,
          withinSelectedArea: topRatedDiscovery
            ? service.business.verified &&
              Number(service.business.averageRating) >= 4 &&
              service.business.reviewCount > 0
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
      .filter((service) => service.withinSelectedArea)
      .sort((left, right) => {
        if (topRatedDiscovery) {
          return Number(right.business.verified) - Number(left.business.verified) ||
            Number(right.business.averageRating) - Number(left.business.averageRating) ||
            right.business.reviewCount - left.business.reviewCount ||
            comparePlanRanking(
              { priority: left.planPriority, startsAt: left.planStartedAt },
              { priority: right.planPriority, startsAt: right.planStartedAt },
            );
        }
        return comparePlanRanking(
          { priority: left.planPriority, startsAt: left.planStartedAt },
          { priority: right.planPriority, startsAt: right.planStartedAt },
        ) ||
          (left.distanceKm ?? Number.MAX_SAFE_INTEGER) -
            (right.distanceKm ?? Number.MAX_SAFE_INTEGER) ||
          right.createdAt.getTime() - left.createdAt.getTime();
      });
    const skip = (query.page - 1) * query.pageSize;
    return {
      data: ranked.slice(skip, skip + query.pageSize),
      meta: { page: query.page, pageSize: query.pageSize, radiusKm: query.radiusKm, total: ranked.length },
    };
  }

  async find(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, isActive: true, deletedAt: null, business: { status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null } },
      include: {
        category: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            verified: true,
            publicPhone: true,
            locations: { where: { isActive: true } },
          },
        },
        media: { where: { scanStatus: "approved" }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!service) throw new NotFoundException("Service not found.");
    return { data: service };
  }

  async create(userId: string, input: CreateServiceDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    await this.planEntitlements.requirePlan(input.businessId);
    await this.requireBusinessCategory(input.businessId, input.categoryId);
    if (input.media?.length) {
      await this.mediaStorage.requireOwnedObjects(
        userId,
        "service_image",
        input.businessId,
        input.media.map((item) => item.objectKey),
      );
    }
    const promotedMedia = input.media?.length
      ? await this.mediaStorage.promoteServiceObjects(
          input.media.map((item, index) => ({
            id: String(index),
            objectKey: item.objectKey,
            publicUrl: null,
            scanStatus: "pending",
          })),
        )
      : [];
    const data = await this.prisma.service.create({
      data: {
        businessId: input.businessId,
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        startingPrice: input.startingPrice,
        pricingType: input.pricingType ?? "STARTING_AT",
        durationMinutes: input.durationMinutes,
        homeService: input.homeService ?? false,
        availability: input.availability as Prisma.InputJsonValue | undefined,
        serviceAreas: input.serviceAreas as Prisma.InputJsonValue | undefined,
        bookingQuestions: input.bookingQuestions as Prisma.InputJsonValue | undefined,
        media: input.media ? {
          create: input.media.map((item, index) => ({
            objectKey: promotedMedia[index]?.objectKey ?? item.objectKey,
            publicUrl: promotedMedia[index]?.publicUrl,
            mediaType: item.mediaType,
            altText: item.altText,
            sortOrder: item.sortOrder ?? 0,
            scanStatus: promotedMedia[index]?.scanStatus ?? "pending",
          })),
        } : undefined,
      },
      include: { category: true, media: true },
    });
    return { data };
  }

  async update(userId: string, id: string, input: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id }, select: { businessId: true } });
    if (!service) throw new NotFoundException("Service not found.");
    await this.businessAccess.require(userId, service.businessId, "business:catalog:manage");
    await this.planEntitlements.requirePlan(service.businessId);
    if (input.categoryId) {
      await this.requireBusinessCategory(service.businessId, input.categoryId);
    }
    if (input.media?.length) {
      await this.mediaStorage.requireOwnedObjects(
        userId,
        "service_image",
        service.businessId,
        input.media.map((item) => item.objectKey),
      );
    }
    const promotedMedia = input.media?.length
      ? await this.mediaStorage.promoteServiceObjects(
          input.media.map((item, index) => ({
            id: String(index),
            objectKey: item.objectKey,
            publicUrl: null,
            scanStatus: "pending",
          })),
        )
      : [];
    const { media, ...fields } = input;
    const update: Prisma.ServiceUncheckedUpdateInput = {
      ...fields,
      availability: input.availability as Prisma.InputJsonValue | undefined,
      serviceAreas: input.serviceAreas as Prisma.InputJsonValue | undefined,
      bookingQuestions: input.bookingQuestions as Prisma.InputJsonValue | undefined,
    };
    const data = await this.prisma.$transaction(async (transaction) => {
      await transaction.service.update({ where: { id }, data: update });
      if (media) {
        await transaction.serviceMedia.deleteMany({ where: { serviceId: id } });
        if (media.length) {
          await transaction.serviceMedia.createMany({
            data: media.map((item, index) => ({
              serviceId: id,
              objectKey: promotedMedia[index]?.objectKey ?? item.objectKey,
              publicUrl: promotedMedia[index]?.publicUrl,
              mediaType: item.mediaType,
              altText: item.altText,
              sortOrder: item.sortOrder ?? 0,
              scanStatus: promotedMedia[index]?.scanStatus ?? "pending",
            })),
          });
        }
      }
      return transaction.service.findUniqueOrThrow({ where: { id }, include: { media: true } });
    });
    return { data };
  }

  async manage(userId: string, businessId: string) {
    if (!businessId) throw new BadRequestException("businessId is required.");
    await this.businessAccess.require(userId, businessId, "business:view");
    const data = await this.prisma.service.findMany({
      where: { businessId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { data };
  }

  private async requireBusinessCategory(businessId: string, categoryId: string) {
    const category = await this.prisma.businessCategory.findUnique({
      where: { businessId_categoryId: { businessId, categoryId } },
      select: { categoryId: true },
    });
    if (!category) {
      throw new BadRequestException(
        "Add this category to the business profile before publishing services in it.",
      );
    }
  }

  async archive(userId: string, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id }, select: { businessId: true } });
    if (!service) throw new NotFoundException("Service not found.");
    await this.businessAccess.require(userId, service.businessId, "business:catalog:manage");
    await this.prisma.service.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    return { data: { archived: true } };
  }

}
