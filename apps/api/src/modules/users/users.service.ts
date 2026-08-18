import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { BlockBusinessDto } from "./dto/block-business.dto";
import type { ConsentDto } from "./dto/consent.dto";
import type { RecordSearchHistoryDto } from "./dto/record-search-history.dto";
import type { SavedAddressDto } from "./dto/saved-address.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        phoneVerifiedAt: true,
        emailVerifiedAt: true,
        role: true,
        status: true,
        preferredLanguage: true,
        lastLoginAt: true,
        createdAt: true,
        customerProfile: true,
        businessOwner: { select: { id: true, legalName: true } },
      },
    });
    if (!user) throw new NotFoundException("User account not found.");
    return { data: user };
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.preferredLanguage ? { preferredLanguage: input.preferredLanguage } : {}),
        customerProfile: {
          upsert: {
            create: {
              displayName: input.displayName,
              defaultCity: input.defaultCity,
              defaultState: input.defaultState,
            },
            update: {
              ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
              ...(input.defaultCity === undefined ? {} : { defaultCity: input.defaultCity }),
              ...(input.defaultState === undefined ? {} : { defaultState: input.defaultState }),
            },
          },
        },
      },
      select: {
        id: true,
        preferredLanguage: true,
        customerProfile: true,
      },
    });
    return { data: user };
  }

  async savedBusinesses(userId: string) {
    const data = await this.prisma.savedBusiness.findMany({
      where: { userId, business: { status: "ACTIVE", deletedAt: null } },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        business: {
          select: {
            id: true,
            slug: true,
            name: true,
            shortDescription: true,
            logoUrl: true,
            coverImageUrl: true,
            verified: true,
            averageRating: true,
            reviewCount: true,
            categories: {
              where: { isPrimary: true },
              take: 1,
              select: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
              select: { locality: true, city: true },
            },
          },
        },
      },
    });
    return { data };
  }

  async saveBusiness(userId: string, businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new NotFoundException("Business not found.");
    try {
      const saved = await this.prisma.savedBusiness.create({
        data: { userId, businessId },
      });
      return { data: saved };
    } catch (error) {
      if (String(error).includes("Unique constraint")) {
        throw new ConflictException("Business is already saved.");
      }
      throw error;
    }
  }

  async removeSavedBusiness(userId: string, businessId: string) {
    await this.prisma.savedBusiness.deleteMany({ where: { userId, businessId } });
    return { data: { removed: true } };
  }

  async searchHistory(userId: string, limit = 30) {
    const data = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return { data };
  }

  async recordSearchHistory(userId: string, input: RecordSearchHistoryDto) {
    const query = input.query.trim().replace(/\s+/g, " ");
    const recent = await this.prisma.searchHistory.findFirst({
      where: {
        userId,
        query,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const values = {
      language: input.language ?? "en",
      location: input.location as Prisma.InputJsonValue | undefined,
      filters: input.filters as Prisma.InputJsonValue | undefined,
      resultCount: input.resultCount,
    };
    const data = recent
      ? await this.prisma.searchHistory.update({
          where: { id: recent.id },
          data: { ...values, createdAt: new Date() },
        })
      : await this.prisma.searchHistory.create({
          data: { userId, query, ...values },
        });
    return { data };
  }

  async clearSearchHistory(userId: string) {
    const result = await this.prisma.searchHistory.deleteMany({ where: { userId } });
    return { data: { deleted: result.count } };
  }

  async addresses(userId: string) {
    const data = await this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    return { data };
  }

  async addAddress(userId: string, input: SavedAddressDto) {
    const data = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.savedAddress.create({ data: { userId, ...input } });
    });
    return { data };
  }

  async updateAddress(userId: string, addressId: string, input: SavedAddressDto) {
    const existing = await this.prisma.savedAddress.findFirst({ where: { id: addressId, userId }, select: { id: true } });
    if (!existing) throw new NotFoundException("Address not found.");
    const data = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.savedAddress.update({ where: { id: addressId }, data: input });
    });
    return { data };
  }

  async removeAddress(userId: string, addressId: string) {
    const result = await this.prisma.savedAddress.deleteMany({ where: { id: addressId, userId } });
    return { data: { removed: result.count === 1 } };
  }

  async savedProducts(userId: string) {
    const data = await this.prisma.savedProduct.findMany({
      where: {
        userId,
        product: {
          status: "PUBLISHED",
          isActive: true,
          deletedAt: null,
          business: { status: "ACTIVE", deletedAt: null },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        product: {
          select: {
            id: true, name: true, slug: true, price: true, discountPrice: true, stockStatus: true,
            category: { select: { id: true, name: true, slug: true } },
            media: { where: { scanStatus: "approved" }, orderBy: { sortOrder: "asc" }, take: 1 },
            business: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    return { data };
  }

  async saveProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: "PUBLISHED",
        isActive: true,
        deletedAt: null,
        business: { status: "ACTIVE", deletedAt: null },
      },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found.");
    const data = await this.prisma.savedProduct.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return { data };
  }

  async removeSavedProduct(userId: string, productId: string) {
    const result = await this.prisma.savedProduct.deleteMany({ where: { userId, productId } });
    return { data: { removed: result.count === 1 } };
  }

  async recentBusinesses(userId: string) {
    const data = await this.prisma.recentlyViewedBusiness.findMany({
      where: { userId, business: { status: "ACTIVE", deletedAt: null } },
      orderBy: { viewedAt: "desc" },
      take: 30,
      select: {
        viewedAt: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            coverImageUrl: true,
            shortDescription: true,
            verified: true,
            averageRating: true,
            reviewCount: true,
            categories: {
              where: { isPrimary: true },
              take: 1,
              select: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
              select: { locality: true, city: true },
            },
          },
        },
      },
    });
    return { data };
  }

  async recordBusinessView(userId: string, businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new NotFoundException("Business not found.");
    const data = await this.prisma.recentlyViewedBusiness.upsert({
      where: { userId_businessId: { userId, businessId } },
      create: { userId, businessId },
      update: { viewedAt: new Date() },
    });
    return { data };
  }

  async blockedBusinesses(userId: string) {
    const data = await this.prisma.blockedBusiness.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, reason: true, business: { select: { id: true, name: true, slug: true } } },
    });
    return { data };
  }

  async blockBusiness(userId: string, businessId: string, input: BlockBusinessDto) {
    const business = await this.prisma.business.findFirst({ where: { id: businessId, deletedAt: null }, select: { id: true } });
    if (!business) throw new NotFoundException("Business not found.");
    const data = await this.prisma.blockedBusiness.upsert({
      where: { userId_businessId: { userId, businessId } },
      create: { userId, businessId, reason: input.reason },
      update: { reason: input.reason },
    });
    return { data };
  }

  async unblockBusiness(userId: string, businessId: string) {
    const result = await this.prisma.blockedBusiness.deleteMany({ where: { userId, businessId } });
    return { data: { removed: result.count === 1 } };
  }

  async sessions(userId: string) {
    const data = await this.prisma.refreshSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, deviceName: true, ipAddress: true, userAgent: true, createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true },
    });
    return { data };
  }

  async consents(userId: string) {
    const data = await this.prisma.consent.findMany({ where: { userId }, orderBy: { grantedAt: "desc" } });
    return { data };
  }

  async recordConsent(userId: string, input: ConsentDto) {
    const data = await this.prisma.consent.create({
      data: {
        userId,
        type: input.type,
        scope: input.scope as Prisma.InputJsonValue,
        granted: input.granted,
        source: input.source,
        withdrawnAt: input.granted ? null : new Date(),
      },
    });
    return { data };
  }

  async exportData(userId: string) {
    const data = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true, phone: true, email: true, role: true, status: true, preferredLanguage: true, createdAt: true,
        customerProfile: true, addresses: true, savedBusinesses: true, savedProducts: true, searchHistory: true,
        recentlyViewed: true, blockedBusinesses: true, enquiries: true, reviews: true, orders: true,
        notifications: true, notificationPreferences: true, consents: true,
      },
    });
    if (!data) throw new NotFoundException("User account not found.");
    return { data, meta: { exportedAt: new Date().toISOString(), formatVersion: 1 } };
  }

  async deleteAccount(userId: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: "DELETED",
          deletedAt: now,
          phone: null,
          email: null,
          passwordHash: null,
        },
      }),
    ]);
    return { data: { deleted: true, deletedAt: now } };
  }
}
