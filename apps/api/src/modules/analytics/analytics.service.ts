import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import type { AnalyticsRangeDto } from "./dto/analytics-range.dto";
import type { TrackEventDto } from "./dto/track-event.dto";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async track(input: TrackEventDto) {
    const businessEvent = input.eventType !== "SEARCH_IMPRESSION";
    if (businessEvent && !input.businessId) {
      throw new BadRequestException(`${input.eventType} requires a business target.`);
    }
    if (input.businessId) {
      const target = await this.prisma.business.findFirst({
        where: {
          id: input.businessId,
          status: "ACTIVE",
          listingStatus: "PUBLISHED",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!target) throw new NotFoundException("Analytics target is unavailable.");
    }
    if (input.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: input.categoryId, isActive: true },
        select: { id: true },
      });
      if (!category) throw new NotFoundException("Analytics category is unavailable.");
    }

    // Collapse rapid duplicate browser retries while retaining genuinely
    // repeated engagement over time. This is not used to invent or estimate
    // activity: every returned event is backed by a persisted record.
    const duplicate = await this.prisma.analyticsEvent.findFirst({
      where: {
        eventType: input.eventType,
        sessionId: input.sessionId,
        businessId: input.businessId ?? null,
        categoryId: input.categoryId ?? null,
        source: input.source ?? null,
        occurredAt: { gte: new Date(Date.now() - 5_000) },
      },
      select: { id: true, eventType: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
    });
    if (duplicate) return { data: duplicate, deduplicated: true };

    const data = await this.prisma.analyticsEvent.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
      select: { id: true, eventType: true, occurredAt: true },
    });
    return { data, deduplicated: false };
  }

  async businessSummary(userId: string, businessId: string, query: AnalyticsRangeDto) {
    await this.businessAccess.require(userId, businessId, "business:analytics:view");
    const { from, to } = this.range(query);
    const [events, enquiries, leads, savedCount, reviews] = await this.prisma.$transaction([
      this.prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        where: { businessId, occurredAt: { gte: from, lte: to } },
        orderBy: { eventType: "asc" },
        _count: { eventType: true },
      }),
      this.prisma.enquiry.count({ where: { businessId, createdAt: { gte: from, lte: to } } }),
      this.prisma.leadAssignment.count({ where: { businessId, createdAt: { gte: from, lte: to } } }),
      this.prisma.savedBusiness.count({ where: { businessId, createdAt: { gte: from, lte: to } } }),
      this.prisma.review.aggregate({
        where: { businessId, status: "PUBLISHED", createdAt: { gte: from, lte: to }, deletedAt: null },
        _avg: { overallRating: true },
        _count: { _all: true },
      }),
    ]);
    const eventCounts = events as Array<{ eventType: string; _count: { eventType: number } }>;
    const counts = Object.fromEntries(eventCounts.map((event) => [event.eventType, event._count.eventType]));
    const profileViews = counts.PROFILE_VIEW ?? 0;
    const contacts = (counts.CALL_CLICK ?? 0) + (counts.WHATSAPP_CLICK ?? 0);
    return {
      data: {
        range: { from, to },
        events: counts,
        enquiries,
        matchedLeads: leads,
        saves: savedCount,
        reviews: { count: reviews._count._all, averageRating: reviews._avg.overallRating },
        rates: {
          profileToContact: profileViews ? contacts / profileViews : 0,
          profileToEnquiry: profileViews ? enquiries / profileViews : 0,
        },
      },
    };
  }

  async merchantDashboard(userId: string, selectedBusinessId: string) {
    await this.businessAccess.require(userId, selectedBusinessId, "business:view");
    const [businessIds, leadBusinessIds] = await Promise.all([
      this.businessAccess.businessIdsFor(userId, "business:view"),
      this.businessAccess.businessIdsFor(userId, "business:leads:manage"),
    ]);
    if (!businessIds.includes(selectedBusinessId)) throw new BadRequestException("Selected business is not available.");
    const now = new Date();
    const enquiryOwnership: Prisma.EnquiryWhereInput = { OR: [
      { businessId: { in: leadBusinessIds } },
      { lead: { assignments: { some: { businessId: { in: leadBusinessIds }, status: { in: ["QUEUED", "DELIVERED", "VIEWED", "ACCEPTED"] } } } } },
    ] };
    const [totalListings, activeListings, activeOffers, enquiryCount, newEnquiryCount, standaloneLeads, newStandaloneLeads, events, subscription] = await this.prisma.$transaction([
      this.prisma.business.count({ where: { id: { in: businessIds }, deletedAt: null } }),
      this.prisma.business.count({ where: { id: { in: businessIds }, deletedAt: null, status: "ACTIVE", listingStatus: "PUBLISHED" } }),
      this.prisma.offer.count({ where: { businessId: { in: businessIds }, targetCustomerId: null, moderationStatus: "APPROVED", isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } }),
      this.prisma.enquiry.count({ where: enquiryOwnership }),
      this.prisma.enquiry.count({ where: { AND: [enquiryOwnership, { OR: [
        { merchantStates: { none: { businessId: { in: leadBusinessIds } } } },
        { merchantStates: { some: { businessId: { in: leadBusinessIds }, status: "NEW" } } },
      ] }] } }),
      this.prisma.leadAssignment.count({ where: { businessId: { in: leadBusinessIds }, lead: { enquiry: null } } }),
      this.prisma.leadAssignment.count({ where: { businessId: { in: leadBusinessIds }, status: { in: ["QUEUED", "DELIVERED", "VIEWED"] }, expiresAt: { gte: now }, lead: { enquiry: null } } }),
      this.prisma.analyticsEvent.groupBy({
        by: ["eventType"], where: { businessId: { in: businessIds } }, orderBy: { eventType: "asc" }, _count: { eventType: true },
      }),
      this.prisma.businessSubscription.findFirst({
        where: { businessId: selectedBusinessId, status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] }, currentPeriodEnd: { gte: now } },
        orderBy: { createdAt: "desc" }, select: { id: true, status: true, currentPeriodEnd: true, renewalStatus: true, plan: { select: { id: true, name: true } } },
      }),
    ]);
    const recordedEvents = Object.fromEntries((events as Array<{ eventType: string; _count: { eventType: number } }>).map((event) => [event.eventType, event._count.eventType]));
    return { data: {
      selectedBusinessId,
      totalListings,
      activeListings,
      activeOffers,
      leadsReceived: enquiryCount + standaloneLeads,
      newLeads: newEnquiryCount + newStandaloneLeads,
      subscription,
      recordedMetrics: {
        listingViews: recordedEvents.PROFILE_VIEW ?? 0,
        contactClicks: recordedEvents.CALL_CLICK ?? 0,
        whatsappClicks: recordedEvents.WHATSAPP_CLICK ?? 0,
      },
    } };
  }

  async platformSummary(query: AnalyticsRangeDto) {
    const { from, to } = this.range(query);
    const [events, activeBusinesses, users, leads, captured] = await this.prisma.$transaction([
      this.prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        where: { occurredAt: { gte: from, lte: to } },
        orderBy: { eventType: "asc" },
        _count: { eventType: true },
      }),
      this.prisma.business.count({ where: { status: "ACTIVE", deletedAt: null } }),
      this.prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
      this.prisma.lead.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.payment.aggregate({
        where: { status: "CAPTURED", capturedAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    return {
      data: {
        range: { from, to },
        events: Object.fromEntries(
          (events as Array<{ eventType: string; _count: { eventType: number } }>).map(
            (event) => [event.eventType, event._count.eventType],
          ),
        ),
        activeBusinesses,
        activeUsers: users,
        leads,
        capturedPayments: captured._count._all,
        capturedAmount: captured._sum.amount,
      },
    };
  }

  private range(query: AnalyticsRangeDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (from >= to) throw new BadRequestException("Analytics start must be before end.");
    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException("Analytics range cannot exceed 366 days.");
    }
    return { from, to };
  }

}
