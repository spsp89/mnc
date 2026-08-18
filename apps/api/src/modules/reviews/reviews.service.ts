import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateReviewDto } from "./dto/create-review.dto";
import type { ReplyReviewDto } from "./dto/reply-review.dto";
import type { ReportReviewDto } from "./dto/report-review.dto";
import type { UpdateReviewDto } from "./dto/update-review.dto";
import { MediaService } from "../media/media.service";

const blockedTerms = ["scamster", "moron", "idiot"];

function moderationReason(body: string) {
  const normalized = body.toLowerCase();
  if (blockedTerms.some((term) => normalized.includes(term))) return "profanity";
  if ((normalized.match(/https?:\/\//g) ?? []).length > 2) return "link_spam";
  if (/(.)\1{9,}/i.test(body)) return "repeated_character_spam";
  return null;
}

function duplicateKey(body: string) {
  return body.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly mediaStorage: MediaService,
  ) {}

  async mine(userId: string) {
    const data = await this.prisma.review.findMany({
      where: { customerId: userId, deletedAt: null },
      select: {
        id: true,
        businessId: true,
        overallRating: true,
        serviceQuality: true,
        valueForMoney: true,
        responseTime: true,
        staffBehaviour: true,
        body: true,
        recommended: true,
        verifiedInteraction: true,
        helpfulCount: true,
        status: true,
        moderationReason: true,
        createdAt: true,
        editedAt: true,
        business: { select: { name: true, slug: true, logoUrl: true } },
        reply: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  }

  async list(businessId: string, page = 1, pageSize = 20) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 50);
    const where = { businessId, status: "PUBLISHED" as const, deletedAt: null };
    const [data, total, aggregate] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        select: {
          id: true,
          overallRating: true,
          serviceQuality: true,
          valueForMoney: true,
          responseTime: true,
          staffBehaviour: true,
          body: true,
          recommended: true,
          verifiedInteraction: true,
          helpfulCount: true,
          createdAt: true,
          editedAt: true,
          media: { where: { scanStatus: "clean" }, orderBy: { sortOrder: "asc" } },
          customer: { select: { customerProfile: { select: { displayName: true, avatarUrl: true } } } },
          reply: true,
        },
        orderBy: [{ verifiedInteraction: "desc" }, { createdAt: "desc" }],
        skip: (safePage - 1) * safeSize,
        take: safeSize,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ where, _avg: { overallRating: true } }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total, averageRating: aggregate._avg.overallRating } };
  }

  async create(userId: string, input: CreateReviewDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: input.businessId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new NotFoundException("Business not found.");
    if (input.enquiryId && input.orderId) {
      throw new BadRequestException("Choose either an enquiry or an order as review evidence.");
    }
    let verifiedInteraction = false;
    if (input.orderId) {
      const deliveredOrder = await this.prisma.order.findFirst({
        where: {
          id: input.orderId,
          customerId: userId,
          businessId: input.businessId,
          status: { in: ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] },
        },
        select: { id: true },
      });
      if (!deliveredOrder) {
        throw new BadRequestException("Only a completed purchase belonging to you can verify this review.");
      }
      verifiedInteraction = true;
    } else if (input.enquiryId) {
      verifiedInteraction = Boolean(await this.prisma.enquiry.findFirst({
          where: {
            id: input.enquiryId,
            customerId: userId,
            businessId: input.businessId,
            status: { in: ["RESPONDED", "CLOSED"] },
          },
          select: { id: true },
        }));
    }
    const recent = await this.prisma.review.findMany({
      where: {
        businessId: input.businessId,
        customerId: userId,
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { body: true, enquiryId: true, orderId: true },
    });
    const matchingEvidence = input.orderId
      ? recent.some((review) => review.orderId === input.orderId)
      : input.enquiryId
        ? recent.some((review) => review.enquiryId === input.enquiryId)
        : false;
    if (matchingEvidence || recent.some((review) => duplicateKey(review.body) === duplicateKey(input.body))) {
      throw new ConflictException("A matching recent review already exists.");
    }
    const reason = moderationReason(input.body);
    const { media, ...reviewInput } = input;
    if (media?.length) {
      await this.mediaStorage.requireOwnedObjects(
        userId,
        "review_image",
        undefined,
        media.map((item) => item.objectKey),
      );
    }
    const data = await this.prisma.review.create({
      data: {
        ...reviewInput,
        customerId: userId,
        verifiedInteraction,
        status: reason ? "FLAGGED" : "PENDING",
        moderationReason: reason,
        media: media?.length ? {
          create: media.map((item) => ({
            objectKey: item.objectKey,
            mediaType: item.mediaType,
            altText: item.altText,
            sortOrder: item.sortOrder ?? 0,
          })),
        } : undefined,
      },
      include: { media: true },
    });
    return { data, message: reason ? "Review held for moderator review." : "Review submitted for integrity checks." };
  }

  async update(userId: string, reviewId: string, input: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, customerId: userId, deletedAt: null } });
    if (!review) throw new NotFoundException("Review not found.");
    const reason = input.body ? moderationReason(input.body) : null;
    const data = await this.prisma.$transaction(async (tx) => {
      await tx.reviewEditHistory.create({
        data: {
          reviewId,
          body: review.body,
          overallRating: review.overallRating,
          serviceQuality: review.serviceQuality,
          valueForMoney: review.valueForMoney,
          responseTime: review.responseTime,
          staffBehaviour: review.staffBehaviour,
          recommended: review.recommended,
        },
      });
      return tx.review.update({
        where: { id: reviewId },
        data: {
          ...input,
          editedAt: new Date(),
          status: reason ? "FLAGGED" : "PENDING",
          moderationReason: reason,
        },
      });
    });
    return { data, message: "Edited review returned to the integrity queue." };
  }

  async remove(userId: string, reviewId: string) {
    const result = await this.prisma.review.updateMany({
      where: { id: reviewId, customerId: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException("Review not found.");
    return { data: { removed: true } };
  }

  async reply(userId: string, reviewId: string, input: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { businessId: true, status: true },
    });
    if (!review) throw new NotFoundException("Review not found.");
    await this.businessAccess.require(
      userId,
      review.businessId,
      "business:profile:manage",
    );
    const data = await this.prisma.reviewReply.upsert({
      where: { reviewId },
      create: { reviewId, businessId: review.businessId, body: input.body },
      update: { body: input.body },
    });
    return { data };
  }

  async markHelpful(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    if (!review) throw new NotFoundException("Review not found.");
    const data = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.reviewHelpfulVote.findUnique({
        where: { reviewId_userId: { reviewId, userId } },
        select: { reviewId: true },
      });
      if (!existing) {
        await tx.reviewHelpfulVote.create({ data: { reviewId, userId } });
        await tx.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } });
      }
      return tx.review.findUnique({ where: { id: reviewId }, select: { id: true, helpfulCount: true } });
    });
    return { data };
  }

  async report(userId: string, reviewId: string, input: ReportReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    if (!review) throw new NotFoundException("Review not found.");
    const data = await this.prisma.reviewReport.upsert({
      where: { reviewId_reporterId: { reviewId, reporterId: userId } },
      create: { reviewId, reporterId: userId, reason: input.reason, details: input.details },
      update: { reason: input.reason, details: input.details, status: "OPEN", resolvedAt: null },
    });
    return { data, message: "Report received for moderator review." };
  }
}
