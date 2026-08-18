import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateClubEventDto } from "./dto/create-club-event.dto";
import type { CreateClubReferralDto } from "./dto/create-club-referral.dto";
import type { CreateChapterDto } from "./dto/create-chapter.dto";
import type { SendClubMessageDto } from "./dto/send-club-message.dto";
import type { UpdateClubReferralDto } from "./dto/update-club-referral.dto";

@Injectable()
export class BusinessClubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async chapters(userId: string) {
    const [data, registeredBusinesses, clubMembers] = await Promise.all([
      this.prisma.clubChapter.findMany({
        where: { isActive: true },
        include: {
          memberships: {
            where: { userId, status: "ACTIVE" },
            select: { id: true, businessId: true, joinedAt: true },
          },
          _count: {
            select: {
              memberships: { where: { status: "ACTIVE" } },
              messages: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: [{ district: "asc" }, { city: "asc" }, { name: "asc" }],
      }),
      this.prisma.business.count({ where: { deletedAt: null } }),
      this.prisma.clubMembership.count({ where: { status: "ACTIVE" } }),
    ]);
    return { data, meta: { registeredBusinesses, clubMembers } };
  }

  async overview() {
    const [registeredBusinesses, clubMembers, activeChapters] = await Promise.all([
      this.prisma.business.count({ where: { deletedAt: null } }),
      this.prisma.clubMembership.count({ where: { status: "ACTIVE" } }),
      this.prisma.clubChapter.count({ where: { isActive: true } }),
    ]);
    return { data: { registeredBusinesses, clubMembers, activeChapters, maximumChapterSize: 16 } };
  }

  async createChapter(input: CreateChapterDto) {
    const data = await this.prisma.clubChapter.create({ data: input });
    return { data };
  }

  async join(userId: string, chapterId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:view");
    const [chapter, subscription] = await Promise.all([
      this.prisma.clubChapter.findFirst({ where: { id: chapterId, isActive: true } }),
      this.prisma.businessSubscription.findFirst({
        where: {
          businessId,
          status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
          currentPeriodEnd: { gte: new Date() },
          plan: { starLevel: { gte: 5 } },
        },
        include: { plan: { select: { name: true, starLevel: true } } },
        orderBy: { plan: { priority: "desc" } },
      }),
    ]);
    if (!chapter) throw new NotFoundException("Business Club chapter not found.");
    if (!subscription) {
      throw new ForbiddenException("Business Club is reserved for active 5-star and 6-star BNC plans.");
    }
    const existing = await this.prisma.clubMembership.findUnique({
      where: { chapterId_businessId: { chapterId, businessId } },
    });
    if (existing?.status === "ACTIVE") throw new ConflictException("This business already belongs to the chapter.");
    const activeMemberCount = await this.prisma.clubMembership.count({
      where: { chapterId, status: "ACTIVE" },
    });
    if (activeMemberCount >= chapter.capacity) {
      throw new ConflictException(`This private chapter has reached its ${chapter.capacity}-business capacity.`);
    }
    const data = await this.prisma.clubMembership.upsert({
      where: { chapterId_businessId: { chapterId, businessId } },
      create: { chapterId, businessId, userId },
      update: { userId, status: "ACTIVE", joinedAt: new Date() },
      include: { business: { select: { name: true, slug: true } }, chapter: true },
    });
    return { data: { ...data, eligiblePlan: subscription.plan } };
  }

  async messages(userId: string, chapterId: string) {
    await this.requireMembership(userId, chapterId);
    const data = await this.prisma.clubMessage.findMany({
      where: { chapterId, deletedAt: null },
      include: {
        sender: { select: { id: true, customerProfile: { select: { displayName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return { data };
  }

  async send(userId: string, chapterId: string, input: SendClubMessageDto) {
    await this.requireMembership(userId, chapterId);
    const data = await this.prisma.clubMessage.create({
      data: { chapterId, senderId: userId, body: input.body },
      include: {
        sender: { select: { id: true, customerProfile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });
    return { data };
  }

  async members(userId: string, chapterId: string) {
    await this.requireMembership(userId, chapterId);
    const data = await this.prisma.clubMembership.findMany({
      where: { chapterId, status: "ACTIVE" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            shortDescription: true,
            publicPhone: true,
            websiteUrl: true,
            categories: {
              take: 3,
              select: { category: { select: { name: true, slug: true } } },
            },
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
              select: { locality: true, city: true, district: true },
            },
            subscriptions: {
              where: {
                status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
                currentPeriodEnd: { gte: new Date() },
              },
              orderBy: { plan: { priority: "desc" } },
              take: 1,
              select: { plan: { select: { name: true, starLevel: true } } },
            },
          },
        },
        user: {
          select: {
            id: true,
            customerProfile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [{ joinedAt: "asc" }],
      take: 500,
    });
    return { data };
  }

  async events(userId: string, chapterId: string) {
    await this.requireMembership(userId, chapterId);
    const data = await this.prisma.clubEvent.findMany({
      where: { chapterId, status: { in: ["PUBLISHED", "COMPLETED"] } },
      include: {
        createdBy: {
          select: { customerProfile: { select: { displayName: true } } },
        },
        registrations: {
          where: { membership: { userId } },
          select: { id: true, status: true },
          take: 1,
        },
        _count: { select: { registrations: { where: { status: "ATTENDING" } } } },
      },
      orderBy: { startsAt: "asc" },
      take: 100,
    });
    return { data };
  }

  async createEvent(userId: string, chapterId: string, input: CreateClubEventDto) {
    await this.requireMembership(userId, chapterId);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("The event end must be after its start.");
    const data = await this.prisma.clubEvent.create({
      data: {
        chapterId,
        createdById: userId,
        title: input.title,
        description: input.description,
        venue: input.venue,
        startsAt,
        endsAt,
        capacity: input.capacity,
        status: "PUBLISHED",
      },
    });
    return { data };
  }

  async registerForEvent(userId: string, chapterId: string, eventId: string) {
    const membership = await this.requireMembership(userId, chapterId);
    const event = await this.prisma.clubEvent.findFirst({
      where: { id: eventId, chapterId, status: "PUBLISHED", endsAt: { gte: new Date() } },
      include: { _count: { select: { registrations: { where: { status: "ATTENDING" } } } } },
    });
    if (!event) throw new NotFoundException("Active chapter event not found.");
    const existing = await this.prisma.clubEventRegistration.findUnique({
      where: { eventId_membershipId: { eventId, membershipId: membership.id } },
    });
    if (existing?.status !== "ATTENDING" && event.capacity && event._count.registrations >= event.capacity) {
      throw new ConflictException("This event has reached capacity.");
    }
    const data = await this.prisma.clubEventRegistration.upsert({
      where: { eventId_membershipId: { eventId, membershipId: membership.id } },
      create: { eventId, membershipId: membership.id },
      update: { status: "ATTENDING", registeredAt: new Date() },
    });
    return { data };
  }

  async cancelEventRegistration(userId: string, chapterId: string, eventId: string) {
    const membership = await this.requireMembership(userId, chapterId);
    const registration = await this.prisma.clubEventRegistration.findUnique({
      where: { eventId_membershipId: { eventId, membershipId: membership.id } },
      include: { event: { select: { chapterId: true } } },
    });
    if (!registration || registration.event.chapterId !== chapterId) {
      throw new NotFoundException("Event registration not found.");
    }
    const data = await this.prisma.clubEventRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });
    return { data };
  }

  async referrals(userId: string, chapterId: string) {
    await this.requireMembership(userId, chapterId);
    const data = await this.prisma.clubReferral.findMany({
      where: { chapterId },
      include: {
        membership: { select: { business: { select: { id: true, name: true, slug: true } } } },
        createdBy: { select: { customerProfile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    return { data };
  }

  async createReferral(
    userId: string,
    chapterId: string,
    input: CreateClubReferralDto,
  ) {
    const membership = await this.requireMembership(userId, chapterId);
    const data = await this.prisma.clubReferral.create({
      data: {
        chapterId,
        membershipId: membership.id,
        createdById: userId,
        ...input,
      },
      include: {
        membership: { select: { business: { select: { id: true, name: true, slug: true } } } },
        createdBy: { select: { customerProfile: { select: { displayName: true } } } },
      },
    });
    return { data };
  }

  async updateReferral(
    userId: string,
    chapterId: string,
    referralId: string,
    input: UpdateClubReferralDto,
  ) {
    await this.requireMembership(userId, chapterId);
    const referral = await this.prisma.clubReferral.findFirst({
      where: { id: referralId, chapterId },
    });
    if (!referral) throw new NotFoundException("Chapter referral not found.");
    if (referral.createdById !== userId) {
      throw new ForbiddenException("Only the member who added this referral can update it.");
    }
    const data = await this.prisma.clubReferral.update({
      where: { id: referralId },
      data: {
        status: input.status,
        convertedAt: input.status === "CONVERTED" ? new Date() : null,
      },
    });
    return { data };
  }

  async adminOverview() {
    const data = await this.prisma.clubChapter.findMany({
      include: {
        memberships: {
          include: {
            business: { select: { id: true, name: true, slug: true } },
            user: { select: { id: true, email: true, customerProfile: { select: { displayName: true } } } },
          },
          orderBy: { joinedAt: "desc" },
        },
        events: {
          orderBy: { startsAt: "desc" },
          take: 25,
          include: { _count: { select: { registrations: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { sender: { select: { customerProfile: { select: { displayName: true } } } } },
        },
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { membership: { select: { business: { select: { name: true } } } } },
        },
        _count: { select: { memberships: true, messages: true, events: true, referrals: true } },
      },
      orderBy: [{ isActive: "desc" }, { district: "asc" }, { name: "asc" }],
    });
    return { data };
  }

  async moderateMembership(
    adminId: string,
    membershipId: string,
    status: "ACTIVE" | "SUSPENDED" | "LEFT",
    reason: string,
  ) {
    const membership = await this.prisma.clubMembership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new NotFoundException("Club membership not found.");
    const data = await this.prisma.clubMembership.update({
      where: { id: membershipId },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedById: adminId,
        moderationReason: reason,
      },
    });
    return { data };
  }

  async moderateMessage(adminId: string, messageId: string, reason: string) {
    const message = await this.prisma.clubMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException("Club message not found.");
    const data = await this.prisma.clubMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), moderatedById: adminId, moderationReason: reason },
    });
    return { data };
  }

  private async requireMembership(userId: string, chapterId: string) {
    const membership = await this.prisma.clubMembership.findFirst({
      where: { chapterId, userId, status: "ACTIVE", chapter: { isActive: true } },
    });
    if (!membership) throw new ForbiddenException("Join this chapter before using its chat.");
    return membership;
  }
}
