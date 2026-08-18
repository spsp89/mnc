import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Job } from "bullmq";
import { PrismaService } from "../../database/prisma.service";
import { LEAD_MATCHING_QUEUE } from "./leads.service";
import { calculateDistanceKm } from "../../common/location/local-discovery";

@Injectable()
@Processor(LEAD_MATCHING_QUEUE)
export class LeadMatchingProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ leadId: string }>) {
    if (job.name !== "match-lead") return;
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id: job.data.leadId },
      include: { enquiry: { select: { businessId: true } } },
    });
    if (lead.expiresAt <= new Date()) {
      await this.prisma.lead.update({ where: { id: lead.id }, data: { status: "EXPIRED" } });
      return { matched: 0, expired: true };
    }

    const businesses = await this.prisma.business.findMany({
      where: {
        ...(lead.enquiry?.businessId ? { id: lead.enquiry.businessId } : {}),
        status: "ACTIVE",
        deletedAt: null,
        categories: { some: { categoryId: lead.categoryId } },
        locations: { some: { isActive: true } },
      },
      select: {
        id: true,
        name: true,
        verified: true,
        profileCompleteness: true,
        averageRating: true,
        responseRate: true,
        locations: {
          where: { isActive: true },
          orderBy: { isPrimary: "desc" },
          take: 1,
          select: { latitude: true, longitude: true, serviceRadiusKm: true },
        },
        owner: { select: { userId: true } },
        members: {
          where: { active: true },
          select: { userId: true },
        },
        subscriptions: {
          where: {
            status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
            currentPeriodEnd: { gte: new Date() },
          },
          orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
          take: 1,
          select: {
            id: true,
            startsAt: true,
            plan: { select: { priority: true, leadQuota: true, automaticLeadAlerts: true } },
            leadCreditsUsed: true,
          },
        },
      },
      take: 250,
    });

    const originLatitude = Number(lead.latitude ?? 0);
    const originLongitude = Number(lead.longitude ?? 0);
    const matches = businesses
      .map((business) => {
        const location = business.locations[0];
        if (!location) return null;
        const distance =
          lead.latitude && lead.longitude
            ? calculateDistanceKm(
                originLatitude,
                originLongitude,
                Number(location.latitude),
                Number(location.longitude),
              )
            : 0;
        const allowedRadius = Math.min(lead.radiusKm, location.serviceRadiusKm);
        if (distance > allowedRadius) return null;
        const subscription = business.subscriptions[0];
        if (
          lead.source === "SEARCH_INTENT" &&
          !subscription?.plan.automaticLeadAlerts
        ) {
          return null;
        }
        if (
          lead.source !== "SEARCH_INTENT" &&
          subscription?.plan.leadQuota &&
          subscription.leadCreditsUsed >= subscription.plan.leadQuota
        ) {
          return null;
        }
        const score =
          (subscription?.plan.priority ?? 0) * 3 +
          (business.verified ? 8 : 0) +
          business.profileCompleteness * 0.08 +
          Number(business.averageRating) * 5 +
          Number(business.responseRate) * 0.12 +
          Math.max(0, 10 - distance) * 2;
        return { business, distance, score, subscription };
      })
      .filter((match): match is NonNullable<typeof match> => match !== null)
      .sort((a, b) => {
        const planDifference =
          (b.subscription?.plan.priority ?? 0) - (a.subscription?.plan.priority ?? 0);
        if (planDifference !== 0) return planDifference;
        const joinedDifference =
          (a.subscription?.startsAt.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.subscription?.startsAt.getTime() ?? Number.MAX_SAFE_INTEGER);
        return joinedDifference || b.score - a.score;
      })
      .slice(0, 20);

    const recipients = new Map<string, { businessId: string; businessName: string }>();
    for (const { business } of matches) {
      recipients.set(business.owner.userId, {
        businessId: business.id,
        businessName: business.name,
      });
      for (const member of business.members) {
        recipients.set(member.userId, {
          businessId: business.id,
          businessName: business.name,
        });
      }
    }
    const preferences = recipients.size
      ? await this.prisma.notificationPreference.findMany({
          where: {
            userId: { in: [...recipients.keys()] },
            type: "NEW_LEAD",
          },
          select: { userId: true, inApp: true },
        })
      : [];
    const disabledRecipients = new Set(
      preferences.filter((preference) => !preference.inApp).map((preference) => preference.userId),
    );
    const sentAt = new Date();
    const notifications = [...recipients.entries()]
      .filter(([userId]) => !disabledRecipients.has(userId))
      .map(([userId, recipient]) => ({
        id: `new-lead-${lead.id}-${userId}`,
        userId,
        type: "NEW_LEAD" as const,
        channel: "IN_APP" as const,
        title: "New matching customer lead",
        body: `${recipient.businessName} received a new ${lead.radiusKm} km category match.`,
        data: {
          leadId: lead.id,
          businessId: recipient.businessId,
          categoryId: lead.categoryId,
        },
        sentAt,
      }));

    await this.prisma.$transaction(async (transaction) => {
      await transaction.leadAssignment.createMany({
        data: matches.map(({ business, distance, score, subscription }) => ({
          leadId: lead.id,
          businessId: business.id,
          subscriptionId: subscription?.id,
          status: "QUEUED",
          matchScore: score,
          distanceKm: distance,
          creditCost: lead.source === "SEARCH_INTENT" ? 0 : 1,
          expiresAt: lead.expiresAt,
        })),
        skipDuplicates: true,
      });
      await transaction.lead.update({
        where: { id: lead.id },
        data: { status: matches.length ? "DELIVERED" : "MATCHING" },
      });
      if (notifications.length) {
        await transaction.notification.createMany({
          data: notifications,
          skipDuplicates: true,
        });
      }
    });

    return { matched: matches.length, notifications: notifications.length };
  }
}
