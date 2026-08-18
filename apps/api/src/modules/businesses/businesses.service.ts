import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { PersonalDataService } from "../../common/crypto/personal-data.service";
import {
  businessCapabilities,
  BusinessAccessService,
} from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import type { CreateBusinessDto } from "./dto/create-business.dto";
import type { ListBusinessesDto } from "./dto/list-businesses.dto";
import type { UpdateBusinessDto } from "./dto/update-business.dto";
import type { AddBusinessMemberDto } from "./dto/add-business-member.dto";
import type { UpdateBusinessMemberDto } from "./dto/update-business-member.dto";
import type { UpdateBusinessCategoriesDto } from "./dto/update-business-categories.dto";
import type { AttachBusinessMediaDto } from "./dto/attach-business-media.dto";
import { PlanEntitlementsService } from "../../common/subscriptions/plan-entitlements.service";
import { MediaService } from "../media/media.service";

const businessCardSelect = (now: Date) => ({
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  logoUrl: true,
  coverImageUrl: true,
  publicPhone: true,
  verified: true,
  premium: true,
  averageRating: true,
  reviewCount: true,
  medianResponseMinutes: true,
  priceRange: true,
  yearsInBusiness: true,
  attributes: true,
  websiteUrl: true,
  socialLinks: true,
  permanentDiscountPercent: true,
  permanentDiscountLabel: true,
  publishedAt: true,
  listingStatus: true,
  tags: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  locations: {
    where: { isPrimary: true, isActive: true },
    take: 1,
    select: {
      locality: true,
      city: true,
      district: true,
      state: true,
      latitude: true,
      longitude: true,
    },
  },
  categories: {
    where: { isPrimary: true },
    take: 1,
    select: { category: { select: { id: true, name: true, slug: true } } },
  },
  subscriptions: {
    where: {
      status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
      currentPeriodEnd: { gte: now },
    },
    orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
    take: 1,
    select: {
      startsAt: true,
      currentPeriodEnd: true,
      plan: {
        select: {
          name: true,
          slug: true,
          priority: true,
          starLevel: true,
          sponsoredPlacement: true,
          descriptionEnabled: true,
          socialLinksEnabled: true,
        },
      },
    },
  },
}) as const satisfies Prisma.BusinessSelect;

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personalData: PersonalDataService,
    private readonly businessAccess: BusinessAccessService,
    private readonly planEntitlements: PlanEntitlementsService,
    private readonly mediaStorage: MediaService,
  ) {}

  async list(query: ListBusinessesDto) {
    const where = {
      status: "ACTIVE" as const,
      listingStatus: "PUBLISHED" as const,
      deletedAt: null,
      ...(query.verified === undefined ? {} : { verified: query.verified }),
      ...(query.city
        ? { locations: { some: { city: { equals: query.city, mode: "insensitive" as const }, isActive: true } } }
        : {}),
      ...(query.category
        ? { categories: { some: { category: { slug: query.category } } } }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.business.findMany({
        where,
        select: businessCardSelect(new Date()),
        orderBy: [{ premium: "desc" }, { averageRating: "desc" }, { reviewCount: "desc" }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      data: items.map((item) => {
        const plan = item.subscriptions[0]?.plan;
        return {
          ...item,
          shortDescription: plan?.descriptionEnabled === false ? null : item.shortDescription,
          socialLinks: plan?.socialLinksEnabled === false ? null : item.socialLinks,
        };
      }),
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findBySlug(slug: string) {
    const business = await this.prisma.business.findFirst({
      where: { slug, status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null },
      include: {
        locations: { where: { isActive: true }, orderBy: { isPrimary: "desc" } },
        categories: { include: { category: true } },
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        media: { orderBy: { sortOrder: "asc" } },
        products: {
          where: { status: "PUBLISHED", isActive: true, deletedAt: null },
          take: 12,
        },
        services: { where: { isActive: true, deletedAt: null }, take: 20 },
        offers: {
          where: { targetCustomerId: null, isActive: true, moderationStatus: "APPROVED", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
        },
        reviews: {
          where: { status: "PUBLISHED", deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        subscriptions: {
          where: {
            status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
            currentPeriodEnd: { gte: new Date() },
          },
          orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
          take: 1,
          include: { plan: true },
        },
      },
    });
    if (!business) throw new NotFoundException("Business not found.");
    const plan = business.subscriptions[0]?.plan;
    return {
      data: {
        ...business,
        description: plan?.descriptionEnabled === false ? "" : business.description,
        shortDescription: plan?.descriptionEnabled === false ? null : business.shortDescription,
        socialLinks: plan?.socialLinksEnabled === false ? null : business.socialLinks,
        products: business.products.map((product) => ({
          ...product,
          deliveryOptions: plan?.deliveryEnabled ? product.deliveryOptions : [],
        })),
      },
    };
  }

  async create(userId: string, input: CreateBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Business slug is already in use.");
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { slug: input.planSlug, isActive: true },
    });
    if (!plan) throw new NotFoundException("Selected business plan is not available.");
    if (plan.descriptionEnabled && !input.description?.trim()) {
      throw new BadRequestException(
        `${plan.name} includes a business description, so a description is required.`,
      );
    }
    if (!plan.socialLinksEnabled && input.socialLinks && Object.keys(input.socialLinks).length) {
      throw new BadRequestException(
        `Social media links are not included in the ${plan.name} plan.`,
      );
    }
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    if (input.billingCycle === "annual") currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    else currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    const data = await this.prisma.$transaction(async (transaction) => {
      const owner = await transaction.businessOwner.upsert({
        where: { userId },
        create: { userId, legalName: input.ownerLegalName },
        update: { legalName: input.ownerLegalName },
      });
      await transaction.user.updateMany({
        where: { id: userId, role: "CUSTOMER" },
        data: { role: "BUSINESS_OWNER" },
      });
      const business = await transaction.business.create({
        data: {
          ownerId: owner.id,
          name: input.name,
          slug: input.slug,
          legalName: input.legalName,
          description: plan.descriptionEnabled ? input.description! : "",
          shortDescription: plan.descriptionEnabled ? input.shortDescription : null,
          phoneEncrypted: this.personalData.encrypt(input.phone),
          publicPhone: input.displayPhonePublicly ? input.phone : null,
          whatsappEncrypted: input.whatsapp
            ? this.personalData.encrypt(input.whatsapp)
            : undefined,
          email: input.email,
          websiteUrl: input.websiteUrl,
          socialLinks: plan.socialLinksEnabled
            ? input.socialLinks as Prisma.InputJsonValue | undefined
            : undefined,
          permanentDiscountPercent: input.permanentDiscountPercent,
          permanentDiscountLabel: input.permanentDiscountLabel,
          yearsInBusiness: input.yearsInBusiness,
          priceRange: input.priceRange,
          status: "DRAFT",
          profileCompleteness: this.completeness(input),
          attributes: { acceptNewEnquiries: true },
          locations: {
            create: {
              ...input.location,
              serviceRadiusKm: input.location.serviceRadiusKm ?? 5,
              isPrimary: true,
            },
          },
          categories: {
            create: { categoryId: input.categoryId, isPrimary: true },
          },
          workingHours: input.workingHours?.length
            ? {
                create: input.workingHours.map((hour) => ({
                  ...hour,
                  closed: hour.closed ?? false,
                })),
              }
            : undefined,
        },
        include: {
          locations: true,
          categories: { include: { category: true } },
          workingHours: true,
        },
      });
      const subscription = await transaction.businessSubscription.create({
        data: {
          businessId: business.id,
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle: input.billingCycle,
          startsAt: now,
          currentPeriodStart: now,
          currentPeriodEnd,
          autoRenew: false,
          renewalStatus: "PAYMENT_PENDING",
          source: "CHECKOUT",
        },
        include: { plan: true },
      });
      return { ...business, subscriptions: [subscription] };
    });
    return { data };
  }

  async mine(userId: string) {
    const data = await this.prisma.business.findMany({
      where: {
        deletedAt: null,
        OR: [
          { owner: { userId } },
          { members: { some: { userId, active: true } } },
        ],
      },
      select: {
        ...businessCardSelect(new Date()),
        status: true,
        listingStatus: true,
        profileCompleteness: true,
        responseRate: true,
        lastActiveAt: true,
        updatedAt: true,
      },
      orderBy: [{ lastActiveAt: "desc" }, { updatedAt: "desc" }],
    });
    return { data };
  }

  async managed(userId: string, id: string) {
    await this.businessAccess.require(userId, id, "business:view");
    const data = await this.prisma.business.findUniqueOrThrow({
      where: { id },
      include: {
        owner: { select: { legalName: true } },
        locations: {
          orderBy: { isPrimary: "desc" },
          include: { managedLocation: { select: { id: true, name: true, type: true, isActive: true } } },
        },
        categories: { include: { category: true } },
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        media: { orderBy: { sortOrder: "asc" } },
        products: {
          where: { deletedAt: null },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            media: { orderBy: [{ sortOrder: "asc" }, { variant: "asc" }] },
          },
          orderBy: { createdAt: "desc" },
        },
        services: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
        offers: { where: { targetCustomerId: null }, orderBy: { createdAt: "desc" } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });
    const plan = await this.planEntitlements.activePlan(id);
    const entitlements = plan ? await this.planEntitlements.usage(id) : null;
    return {
      data: {
        ...data,
        contactPhone: data.phoneEncrypted
          ? this.personalData.decrypt(data.phoneEncrypted)
          : data.publicPhone,
        contactWhatsapp: data.whatsappEncrypted
          ? this.personalData.decrypt(data.whatsappEncrypted)
          : null,
        phoneEncrypted: undefined,
        whatsappEncrypted: undefined,
        entitlements,
      },
    };
  }

  async update(userId: string, id: string, input: UpdateBusinessDto) {
    await this.businessAccess.require(userId, id, "business:profile:manage");
    if (input.description?.trim() || input.shortDescription?.trim()) {
      const plan = await this.planEntitlements.activePlan(id);
      if (plan && !plan.descriptionEnabled) {
        await this.planEntitlements.requireFeature(id, "descriptionEnabled");
      }
    }
    if (input.socialLinks !== undefined) {
      await this.planEntitlements.requireFeature(id, "socialLinksEnabled");
    }
    const current = await this.prisma.business.findUniqueOrThrow({
      where: { id },
      include: {
        locations: true,
        categories: true,
        services: { where: { isActive: true } },
        media: true,
        workingHours: true,
      },
    });
    const {
      acceptNewEnquiries,
      socialLinks,
      upiId,
      paymentAccountName,
      ownerContactName,
      contactPhone,
      contactWhatsapp,
      location,
      workingHours,
      ...fields
    } = input;
    if (fields.slug !== undefined) {
      const conflict = await this.prisma.business.findFirst({
        where: { slug: fields.slug, id: { not: id } },
        select: { id: true },
      });
      if (conflict) throw new ConflictException("Business slug is already in use.");
    }
    if (location?.managedLocationId) {
      const managedLocation = await this.prisma.managedLocation.findUnique({
        where: { id: location.managedLocationId },
        select: { id: true, isActive: true },
      });
      const currentManagedLocationId = current.locations.find((item) => item.isPrimary)?.managedLocationId;
      if (!managedLocation || (!managedLocation.isActive && managedLocation.id !== currentManagedLocationId)) {
        throw new BadRequestException("Select an active managed location.");
      }
    }
    const normalizedSocialLinks = socialLinks === undefined
      ? undefined
      : this.normalizedSocialLinks(socialLinks);
    const attributes = {
      ...((current.attributes ?? {}) as Record<string, unknown>),
      ...(acceptNewEnquiries === undefined
        ? {}
        : { acceptNewEnquiries }),
      ...(upiId === undefined ? {} : { upiId: upiId?.trim() ?? "" }),
      ...(paymentAccountName === undefined
        ? {}
        : { paymentAccountName: paymentAccountName?.trim() ?? "" }),
    };
    const updateData: Prisma.BusinessUpdateInput = {
      ...fields,
      ...(contactPhone === undefined
        ? {}
        : {
            phoneEncrypted: this.personalData.encrypt(contactPhone),
            publicPhone: contactPhone,
          }),
      ...(contactWhatsapp === undefined
        ? {}
        : { whatsappEncrypted: contactWhatsapp ? this.personalData.encrypt(contactWhatsapp) : null }),
      ...(normalizedSocialLinks === undefined
        ? {}
        : { socialLinks: normalizedSocialLinks as Prisma.InputJsonValue }),
      attributes: attributes as Prisma.InputJsonValue,
      profileCompleteness: this.completeness({
        ...current,
        ...fields,
        phone: contactPhone ?? fields.publicPhone ?? current.publicPhone ?? "",
        categoryId: current.categories[0]?.categoryId ?? "",
        location: location ?? current.locations[0],
        workingHours: workingHours ?? current.workingHours,
      }),
    };
    const data = await this.prisma.$transaction(async (transaction) => {
      if (ownerContactName !== undefined) {
        await transaction.businessOwner.update({
          where: { id: current.ownerId },
          data: { legalName: ownerContactName.trim() },
        });
      }
      if (location !== undefined) {
        const primary = current.locations.find((item) => item.isPrimary) ?? current.locations[0];
        if (primary) {
          await transaction.businessLocation.update({
            where: { id: primary.id },
            data: location,
          });
        } else {
          await transaction.businessLocation.create({
            data: { businessId: id, ...location, isPrimary: true },
          });
        }
      }
      if (workingHours !== undefined) {
        if (new Set(workingHours.map((hour) => hour.dayOfWeek)).size !== workingHours.length) {
          throw new BadRequestException("Opening hours contain duplicate days.");
        }
        const invalidHours = workingHours.find((hour) => !hour.closed && (!hour.opensAt || !hour.closesAt || hour.opensAt >= hour.closesAt));
        if (invalidHours) throw new BadRequestException("Each open day requires an opening time earlier than its closing time.");
        await transaction.workingHour.deleteMany({ where: { businessId: id } });
        if (workingHours.length) await transaction.workingHour.createMany({ data: workingHours.map((hour) => ({ businessId: id, ...hour, closed: hour.closed ?? false })) });
      }
      return transaction.business.update({
        where: { id },
        data: updateData,
        include: {
          owner: { select: { legalName: true } },
          locations: { orderBy: { isPrimary: "desc" } },
        },
      });
    });
    return { data };
  }

  async listingAction(userId: string, id: string, action: "PUBLISH" | "UNPUBLISH" | "ARCHIVE") {
    await this.businessAccess.require(userId, id, "business:profile:manage");
    const listing = await this.prisma.business.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true, status: true, verified: true, listingStatus: true, publishedAt: true,
        name: true, slug: true, description: true, publicPhone: true,
        _count: { select: { categories: true, locations: true } },
      },
    });
    if (!listing) throw new NotFoundException("Listing not found.");
    let listingStatus: "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";
    if (action === "PUBLISH") {
      if (listing.listingStatus === "DISABLED") throw new ConflictException("This listing was disabled by an administrator and cannot be published.");
      await this.businessAccess.requireApprovedForPublication(id);
      const plan = await this.planEntitlements.activePlan(id);
      const descriptionIncomplete = plan?.descriptionEnabled !== false && listing.description.trim().length < 30;
      if (!listing.name || !listing.slug || descriptionIncomplete || !listing._count.categories || !listing._count.locations) {
        throw new BadRequestException("Complete the listing name, slug, description, category, and location before publishing.");
      }
      listingStatus = "PUBLISHED";
    } else if (action === "UNPUBLISH") {
      if (listing.listingStatus !== "PUBLISHED") throw new ConflictException("Only a published listing can be unpublished.");
      listingStatus = "UNPUBLISHED";
    } else {
      listingStatus = "ARCHIVED";
    }
    const data = await this.prisma.business.update({
      where: { id },
      data: { listingStatus, publishedAt: listingStatus === "PUBLISHED" ? new Date() : listing.publishedAt },
      select: { id: true, status: true, listingStatus: true, publishedAt: true },
    });
    return { data };
  }

  async updateCategories(
    userId: string,
    businessId: string,
    input: UpdateBusinessCategoriesDto,
  ) {
    await this.businessAccess.require(userId, businessId, "business:profile:manage");
    const categoryIds = [...new Set(input.categoryIds)];
    const primaryCategoryId = input.primaryCategoryId ?? categoryIds[0];
    if (!categoryIds.includes(primaryCategoryId)) {
      throw new BadRequestException("The primary category must be included in the category list.");
    }
    const activePlan = await this.planEntitlements.activePlan(businessId);
    if (!activePlan && categoryIds.length > 1) {
      throw new ConflictException("Select one primary category until a membership plan is active.");
    }
    const plan = activePlan
      ? await this.planEntitlements.assertCategoryCapacity(businessId, categoryIds.length)
      : null;
    const validCategories = await this.prisma.category.count({
      where: { id: { in: categoryIds }, isActive: true },
    });
    if (validCategories !== categoryIds.length) {
      throw new BadRequestException("Every selected category must be active.");
    }
    const inUse = await this.prisma.businessCategory.findMany({
      where: {
        businessId,
        categoryId: { notIn: categoryIds },
        OR: [
          { category: { products: { some: { businessId, deletedAt: null } } } },
          { category: { services: { some: { businessId, deletedAt: null } } } },
        ],
      },
      select: { category: { select: { name: true } } },
    });
    if (inUse.length) {
      throw new ConflictException(
        `Move or archive catalogue items before removing: ${inUse.map((item) => item.category.name).join(", ")}.`,
      );
    }
    const data = await this.prisma.$transaction(async (transaction) => {
      await transaction.businessCategory.deleteMany({
        where: { businessId, categoryId: { notIn: categoryIds } },
      });
      for (const categoryId of categoryIds) {
        await transaction.businessCategory.upsert({
          where: { businessId_categoryId: { businessId, categoryId } },
          create: { businessId, categoryId, isPrimary: categoryId === primaryCategoryId },
          update: { isPrimary: categoryId === primaryCategoryId },
        });
      }
      return transaction.businessCategory.findMany({
        where: { businessId },
        include: { category: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      });
    });
    return { data, limit: plan?.categoryLimit ?? 1 };
  }

  async attachMedia(
    userId: string,
    businessId: string,
    input: AttachBusinessMediaDto,
  ) {
    await this.businessAccess.require(userId, businessId, "business:profile:manage");
    if (input.kind === "gallery") {
      await this.planEntitlements.assertGalleryCapacity(businessId);
    }
    await this.mediaStorage.requireOwnedObjects(
      userId,
      "business_image",
      businessId,
      [input.objectKey],
    );
    const [promoted] = await this.mediaStorage.promoteBusinessObjects([{
      id: "business-profile-media",
      objectKey: input.objectKey,
      publicUrl: null,
      scanStatus: "pending",
    }]);
    if (!promoted?.publicUrl) {
      throw new ConflictException("The business image could not be published.");
    }
    if (input.kind === "logo" || input.kind === "banner") {
      const data = await this.prisma.business.update({
        where: { id: businessId },
        data: input.kind === "logo"
          ? { logoUrl: promoted.publicUrl }
          : { coverImageUrl: promoted.publicUrl },
        select: { id: true, logoUrl: true, coverImageUrl: true },
      });
      return { data: { ...data, kind: input.kind, publicUrl: promoted.publicUrl } };
    }
    const data = await this.planEntitlements.withGalleryCapacity(businessId, async (transaction) => {
      const sortOrder = await transaction.businessMedia.count({ where: { businessId } });
      return transaction.businessMedia.create({
        data: {
          businessId,
          objectKey: promoted.objectKey,
          publicUrl: promoted.publicUrl,
          mediaType: "image",
          altText: input.altText,
          sortOrder,
          scanStatus: promoted.scanStatus,
        },
      });
    });
    return { data };
  }

  async removeMedia(userId: string, businessId: string, mediaId: string) {
    await this.businessAccess.require(userId, businessId, "business:profile:manage");
    const media = await this.prisma.businessMedia.findFirst({
      where: { id: mediaId, businessId },
      select: { id: true },
    });
    if (!media) throw new NotFoundException("Business gallery photo not found.");
    await this.prisma.businessMedia.delete({ where: { id: mediaId } });
    return { data: { id: mediaId, removed: true } };
  }

  private normalizedSocialLinks(input: Record<string, string>) {
    const allowed = new Set(["facebook", "instagram", "youtube", "linkedin", "x", "tiktok"]);
    const entries = Object.entries(input).filter(([, value]) => value.trim().length > 0);
    if (entries.length > 6) throw new BadRequestException("Add no more than six social or video links.");
    for (const [network, value] of entries) {
      if (!allowed.has(network)) throw new BadRequestException(`Unsupported social network: ${network}.`);
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
      } catch {
        throw new BadRequestException(`${network} must be a complete http or https URL.`);
      }
    }
    return Object.fromEntries(entries);
  }

  async team(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:team:manage");
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        owner: {
          select: {
            userId: true,
            legalName: true,
            user: {
              select: {
                email: true,
                phone: true,
                customerProfile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        members: {
          orderBy: [{ active: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            role: true,
            permissions: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                status: true,
                customerProfile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });
    return {
      data: {
        owner: {
          id: `owner:${business.owner.userId}`,
          userId: business.owner.userId,
          role: "OWNER",
          permissions: [...businessCapabilities],
          active: true,
          email: business.owner.user.email,
          phone: business.owner.user.phone,
          name:
            business.owner.user.customerProfile?.displayName ??
            business.owner.legalName,
          avatarUrl: business.owner.user.customerProfile?.avatarUrl ?? null,
        },
        members: business.members.map((member) => ({
          ...member,
          permissions: Array.isArray(member.permissions) ? member.permissions : [],
          email: member.user.email,
          phone: member.user.phone,
          name:
            member.user.customerProfile?.displayName ??
            member.user.email ??
            member.user.phone ??
            "BNC user",
          avatarUrl: member.user.customerProfile?.avatarUrl ?? null,
        })),
      },
    };
  }

  async addTeamMember(
    actorId: string,
    businessId: string,
    input: AddBusinessMemberDto,
  ) {
    await this.businessAccess.require(actorId, businessId, "business:team:manage");
    const email = input.email.trim().toLowerCase();
    const [business, user] = await Promise.all([
      this.prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        select: { owner: { select: { userId: true } } },
      }),
      this.prisma.user.findFirst({
        where: {
          email,
          status: "ACTIVE",
          emailVerifiedAt: { not: null },
          deletedAt: null,
        },
        select: { id: true, email: true },
      }),
    ]);
    if (!user) {
      throw new NotFoundException(
        "Ask this person to create and verify a BNC account before adding them.",
      );
    }
    if (business.owner.userId === user.id) {
      throw new ConflictException("The business owner already has full workspace access.");
    }

    const data = await this.prisma.$transaction(async (transaction) => {
      const before = await transaction.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: user.id } },
      });
      const member = await transaction.businessMember.upsert({
        where: { businessId_userId: { businessId, userId: user.id } },
        create: {
          businessId,
          userId: user.id,
          role: input.role,
          permissions: input.permissions ?? [],
          active: true,
        },
        update: {
          role: input.role,
          permissions: input.permissions ?? [],
          active: true,
        },
      });
      await this.writeAuditLog(transaction, {
        actorId,
        action: before ? "BUSINESS_MEMBER_REACTIVATED" : "BUSINESS_MEMBER_ADDED",
        entityId: member.id,
        before,
        after: member,
      });
      return member;
    });
    return { data, message: `${user.email} can now access this workspace.` };
  }

  async updateTeamMember(
    actorId: string,
    businessId: string,
    memberId: string,
    input: UpdateBusinessMemberDto,
  ) {
    await this.businessAccess.require(actorId, businessId, "business:team:manage");
    if (
      input.role === undefined &&
      input.permissions === undefined &&
      input.active === undefined
    ) {
      throw new ConflictException("Provide at least one team access change.");
    }
    const data = await this.prisma.$transaction(async (transaction) => {
      const before = await transaction.businessMember.findFirst({
        where: { id: memberId, businessId },
      });
      if (!before) throw new NotFoundException("Business team member not found.");
      const member = await transaction.businessMember.update({
        where: { id: memberId },
        data: {
          role: input.role,
          permissions: input.permissions,
          active: input.active,
        },
      });
      if (input.active === false) {
        await transaction.conversationMember.deleteMany({
          where: {
            userId: before.userId,
            conversation: { businessId },
          },
        });
      }
      await this.writeAuditLog(transaction, {
        actorId,
        action: input.active === false ? "BUSINESS_MEMBER_DEACTIVATED" : "BUSINESS_MEMBER_UPDATED",
        entityId: member.id,
        before,
        after: member,
      });
      return member;
    });
    return { data };
  }

  private async writeAuditLog(
    transaction: Prisma.TransactionClient,
    input: {
      actorId: string;
      action: string;
      entityId: string;
      before: unknown;
      after: unknown;
    },
  ) {
    const previous = await transaction.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { entryHash: true },
    });
    const requestId = randomUUID();
    const payload = JSON.stringify({
      ...input,
      requestId,
      previousHash: previous?.entryHash ?? null,
    });
    await transaction.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: "BusinessMember",
        entityId: input.entityId,
        before:
          input.before === null || input.before === undefined
            ? undefined
            : input.before as Prisma.InputJsonValue,
        after: input.after as Prisma.InputJsonValue,
        requestId,
        previousHash: previous?.entryHash,
        entryHash: createHash("sha256").update(payload).digest("hex"),
      },
    });
  }

  private completeness(input: {
    description?: string;
    shortDescription?: string | null;
    phone?: string;
    email?: string | null;
    websiteUrl?: string | null;
    yearsInBusiness?: number | null;
    categoryId?: string;
    location?: unknown;
    workingHours?: unknown[];
    logoUrl?: string | null;
    coverImageUrl?: string | null;
  }) {
    const checks = [
      input.description && input.description.length >= 30,
      input.shortDescription,
      input.phone,
      input.email,
      input.categoryId,
      input.location,
      input.workingHours?.length,
      input.logoUrl,
      input.coverImageUrl,
      input.yearsInBusiness !== undefined && input.yearsInBusiness !== null,
    ];
    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100,
    );
  }

}
