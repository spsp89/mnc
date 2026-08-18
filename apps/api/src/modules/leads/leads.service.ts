import { InjectQueue } from "@nestjs/bullmq";
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Queue } from "bullmq";
import { PersonalDataService } from "../../common/crypto/personal-data.service";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateReferralDto } from "./dto/create-referral.dto";
import type { UpdateReferralDto } from "./dto/update-referral.dto";
import type { CreateSearchIntentDto } from "./dto/create-search-intent.dto";

export const LEAD_MATCHING_QUEUE = "lead-matching";

@Injectable()
export class LeadsService {
  constructor(
    @InjectQueue(LEAD_MATCHING_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
    private readonly personalData: PersonalDataService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async queueMatch(leadId: string) {
    await this.queue.add(
      "match-lead",
      { leadId },
      {
        jobId: `match:${leadId}`,
        attempts: 5,
        backoff: { type: "exponential", delay: 1500 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    );
  }

  async createSearchIntent(userId: string, input: CreateSearchIntentDto) {
    const query = input.query.trim();
    const category = await this.resolveSearchCategory(query, input.source);
    if (!category) {
      return { data: { created: false, reason: "NO_MATCHING_CATEGORY" } };
    }
    const duplicateKey = this.personalData.fingerprint(
      `search-intent:${userId}:${category.id}:${query.toLowerCase()}`,
    );
    const existing = await this.prisma.lead.findFirst({
      where: {
        duplicateKey,
        source: "SEARCH_INTENT",
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        status: { notIn: ["EXPIRED", "SPAM", "REJECTED"] },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      return { data: { ...existing, created: false, duplicate: true, category } };
    }
    const lead = await this.prisma.lead.create({
      data: {
        customerId: userId,
        categoryId: category.id,
        source: "SEARCH_INTENT",
        requirement: `Customer searched for “${query}”`,
        productQuery: query,
        approximateLocation: {
          locality: input.location?.trim() || "Nearby customer",
          source: input.source ?? "businesses",
        },
        latitude: input.latitude,
        longitude: input.longitude,
        radiusKm: input.radiusKm,
        urgency: "DISCOVERY",
        contactEncrypted: null,
        consentScope: {
          contactShared: false,
          notificationOnly: true,
          purpose: "local-search-demand",
        },
        status: "NEW",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duplicateKey,
      },
      select: { id: true, status: true },
    });
    await this.queueMatch(lead.id);
    return { data: { ...lead, created: true, category } };
  }

  async status(userId: string, id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        status: true,
        expiresAt: true,
        assignments: {
          select: {
            status: true,
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
    if (!lead) throw new NotFoundException("Lead not found.");
    if (lead.customerId !== userId) {
      const access = await Promise.all(
        lead.assignments.map((assignment) =>
          this.businessAccess.accessFor(userId, assignment.business.id),
        ),
      );
      if (!access.some((item) => item?.capabilities.includes("business:leads:manage"))) {
        throw new ForbiddenException("You cannot access this lead.");
      }
    }
    return {
      data: {
        id: lead.id,
        status: lead.status,
        expiresAt: lead.expiresAt,
        assignments: lead.assignments.map((assignment) => ({
          status: assignment.status,
          business: {
            id: assignment.business.id,
            name: assignment.business.name,
            slug: assignment.business.slug,
          },
        })),
      },
    };
  }

  async listForBusiness(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:leads:manage");
    const data = await this.prisma.leadAssignment.findMany({
      where: {
        businessId,
        expiresAt: { gte: new Date() },
        status: { in: ["QUEUED", "DELIVERED", "VIEWED", "ACCEPTED"] },
      },
      select: {
        id: true,
        status: true,
        matchScore: true,
        distanceKm: true,
        creditCost: true,
        deliveredAt: true,
        viewedAt: true,
        acceptedAt: true,
        expiresAt: true,
        lead: {
          select: {
            id: true,
            requirement: true,
            approximateLocation: true,
            urgency: true,
            createdAt: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { matchScore: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    return { data };
  }

  async accept(userId: string, assignmentId: string) {
    const assignment = await this.prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        lead: true,
      },
    });
    if (!assignment) throw new NotFoundException("Lead assignment not found.");
    await this.businessAccess.require(userId, assignment.businessId, "business:leads:manage");
    if (assignment.expiresAt <= new Date() || assignment.lead.expiresAt <= new Date()) {
      throw new ConflictException("Lead assignment has expired.");
    }
    if (assignment.status === "ACCEPTED") {
      return {
        data: {
          assignmentId: assignment.id,
          status: assignment.status,
          contact: assignment.lead.contactEncrypted
            ? JSON.parse(this.personalData.decrypt(assignment.lead.contactEncrypted))
            : null,
        },
        idempotent: true,
      };
    }
    const result = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.leadAssignment.updateMany({
        where: { id: assignmentId, status: { in: ["QUEUED", "DELIVERED", "VIEWED"] }, expiresAt: { gte: new Date() } },
        data: { status: "ACCEPTED", acceptedAt: new Date(), viewedAt: assignment.viewedAt ?? new Date() },
      });
      if (updated.count !== 1) throw new ConflictException("Lead assignment is no longer available.");
      if (assignment.subscriptionId) {
        await transaction.businessSubscription.update({
          where: { id: assignment.subscriptionId },
          data: { leadCreditsUsed: { increment: assignment.creditCost } },
        });
      }
      await transaction.lead.update({ where: { id: assignment.leadId }, data: { status: "ACCEPTED" } });
      return transaction.leadAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    });
    return {
      data: {
        ...result,
        contact: assignment.lead.contactEncrypted
          ? JSON.parse(this.personalData.decrypt(assignment.lead.contactEncrypted))
          : null,
      },
    };
  }

  async decline(userId: string, assignmentId: string) {
    const assignment = await this.prisma.leadAssignment.findUnique({
      where: { id: assignmentId },
      select: { businessId: true, status: true },
    });
    if (!assignment) throw new NotFoundException("Lead assignment not found.");
    await this.businessAccess.require(userId, assignment.businessId, "business:leads:manage");
    if (assignment.status === "ACCEPTED") throw new ConflictException("Accepted leads cannot be declined.");
    const data = await this.prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: { status: "DECLINED" },
    });
    return { data };
  }

  async referrals(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:leads:manage");
    const records = await this.prisma.businessReferral.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return {
      data: records.map((referral) => ({
        ...referral,
        phone: referral.phoneEncrypted
          ? this.personalData.decrypt(referral.phoneEncrypted)
          : null,
        phoneEncrypted: undefined,
      })),
    };
  }

  async createReferral(userId: string, input: CreateReferralDto) {
    await this.businessAccess.require(userId, input.businessId, "business:leads:manage");
    const data = await this.prisma.businessReferral.create({
      data: {
        businessId: input.businessId,
        createdById: userId,
        contactName: input.contactName,
        referredBusiness: input.referredBusiness,
        phoneEncrypted: input.phone ? this.personalData.encrypt(input.phone) : undefined,
        email: input.email,
        notes: input.notes,
        estimatedValue: input.estimatedValue,
      },
    });
    return {
      data: {
        ...data,
        phone: input.phone ?? null,
        phoneEncrypted: undefined,
      },
    };
  }

  async updateReferral(userId: string, id: string, input: UpdateReferralDto) {
    const referral = await this.prisma.businessReferral.findUnique({
      where: { id },
      select: { businessId: true },
    });
    if (!referral) throw new NotFoundException("Referral not found.");
    await this.businessAccess.require(userId, referral.businessId, "business:leads:manage");
    const data = await this.prisma.businessReferral.update({
      where: { id },
      data: {
        status: input.status,
        convertedAt: input.status === "CONVERTED" ? new Date() : undefined,
      },
    });
    return { data };
  }

  private async resolveSearchCategory(
    query: string,
    source?: "businesses" | "products" | "services",
  ) {
    const direct = await this.prisma.category.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query.toLowerCase().replace(/[^a-z0-9]+/g, "-"), mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    });
    if (direct) return direct;

    const product = source !== "services"
      ? await this.prisma.product.findFirst({
          where: {
            status: "PUBLISHED",
            isActive: true,
            deletedAt: null,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { category: { select: { id: true, name: true, slug: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : null;
    if (product) return product.category;

    const service = source !== "products"
      ? await this.prisma.service.findFirst({
          where: {
            isActive: true,
            deletedAt: null,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { category: { select: { id: true, name: true, slug: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : null;
    if (service) return service.category;

    const businessCategory = await this.prisma.businessCategory.findFirst({
      where: {
        business: {
          status: "ACTIVE",
          deletedAt: null,
          name: { contains: query, mode: "insensitive" },
        },
      },
      select: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { isPrimary: "desc" },
    });
    return businessCategory?.category ?? null;
  }

}
