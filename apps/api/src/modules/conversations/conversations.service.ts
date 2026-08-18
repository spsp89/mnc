import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateConversationDto } from "./dto/create-conversation.dto";
import type { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async list(userId: string, page = 1, pageSize = 30) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 50);
    const where = { members: { some: { userId } } };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          business: { select: { id: true, name: true, slug: true, logoUrl: true } },
          enquiry: { select: { id: true, requirement: true, status: true } },
          members: { select: { userId: true, lastReadAt: true, muted: true } },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, senderId: true, type: true, body: true, createdAt: true },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    const enriched = await Promise.all(
      data.map(async (conversation) => {
        const member = conversation.members.find((item) => item.userId === userId);
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            deletedAt: null,
            ...(member?.lastReadAt
              ? { createdAt: { gt: member.lastReadAt } }
              : {}),
          },
        });
        return { ...conversation, unreadCount };
      }),
    );
    return { data: enriched, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async create(userId: string, input: CreateConversationDto) {
    if (input.businessId) {
      return this.createDirect(userId, input.businessId, input.initialMessage);
    }
    if (!input.enquiryId) {
      throw new BadRequestException("Choose a business or enquiry to start a conversation.");
    }
    const enquiry = await this.prisma.enquiry.findFirst({
      where: {
        id: input.enquiryId,
      },
      select: {
        id: true,
        customerId: true,
        businessId: true,
        conversation: { select: { id: true } },
        business: { select: { owner: { select: { userId: true } } } },
      },
    });
    if (!enquiry?.businessId) throw new NotFoundException("Eligible enquiry not found.");
    if (enquiry.customerId !== userId) {
      await this.businessAccess.require(
        userId,
        enquiry.businessId,
        "business:leads:manage",
      );
    }
    if (enquiry.conversation) {
      await this.requireMember(userId, enquiry.conversation.id);
      return { data: enquiry.conversation };
    }
    const memberIds = [...new Set([userId, enquiry.customerId, enquiry.business?.owner.userId].filter(Boolean) as string[])];
    const data = await this.prisma.conversation.create({
      data: {
        enquiryId: enquiry.id,
        businessId: enquiry.businessId,
        members: { create: memberIds.map((memberId) => ({ userId: memberId })) },
      },
      include: { members: true },
    });
    return { data };
  }

  private async createDirect(userId: string, businessId: string, initialMessage?: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, status: "ACTIVE", deletedAt: null },
      select: {
        id: true,
        name: true,
        owner: { select: { userId: true } },
      },
    });
    if (!business) throw new NotFoundException("Business not found.");

    const existing = await this.prisma.conversation.findFirst({
      where: {
        businessId,
        enquiryId: null,
        members: { some: { userId } },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        _count: { select: { messages: true } },
      },
    });
    if (existing) {
      if (["BLOCKED", "CLOSED"].includes(existing.status)) {
        throw new ForbiddenException("This business conversation is not accepting new messages.");
      }
      if (initialMessage && existing._count.messages === 0) {
        await this.prisma.$transaction([
          this.prisma.message.create({
            data: {
              conversationId: existing.id,
              senderId: userId,
              type: "TEXT",
              body: initialMessage,
              deliveredAt: new Date(),
            },
          }),
          this.prisma.conversation.update({
            where: { id: existing.id },
            data: { status: "OPEN", updatedAt: new Date() },
          }),
        ]);
      }
      return { data: { id: existing.id } };
    }

    const memberIds = [...new Set([userId, business.owner.userId])];
    const now = new Date();
    const data = await this.prisma.$transaction(async (transaction) => {
      const conversation = await transaction.conversation.create({
        data: {
          businessId,
          members: { create: memberIds.map((memberId) => ({ userId: memberId })) },
        },
        select: { id: true },
      });
      if (initialMessage) {
        await transaction.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            type: "TEXT",
            body: initialMessage,
            deliveredAt: now,
          },
        });
      }
      if (business.owner.userId !== userId) {
        await transaction.notification.create({
          data: {
            userId: business.owner.userId,
            type: "CUSTOMER_RESPONSE",
            channel: "IN_APP",
            title: "New BNC conversation",
            body: `${business.name} received a direct customer message.`,
            data: { conversationId: conversation.id, businessId },
            sentAt: now,
          },
        });
      }
      return conversation;
    });
    return { data };
  }

  async messages(userId: string, conversationId: string, page = 1, pageSize = 50) {
    await this.requireMember(userId, conversationId);
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const where = { conversationId, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        select: {
          id: true, senderId: true, type: true, body: true, attachmentKey: true,
          deliveredAt: true, readAt: true, createdAt: true,
        },
      }),
      this.prisma.message.count({ where }),
    ]);
    return {
      data: data.reverse().map((message) => ({
        ...message,
        mine: message.senderId === userId,
      })),
      meta: { page: safePage, pageSize: safeSize, total },
    };
  }

  async send(userId: string, conversationId: string, input: SendMessageDto) {
    const conversation = await this.requireMember(userId, conversationId);
    if (conversation.status === "BLOCKED" || conversation.status === "CLOSED") {
      throw new ForbiddenException("This conversation does not accept new messages.");
    }
    const data = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type: input.type,
          body: input.type === "TEXT" ? input.body : input.caption,
          attachmentKey: input.type === "TEXT" ? null : input.attachmentKey,
          deliveredAt: new Date(),
        },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { status: "OPEN", updatedAt: new Date() } });
      return message;
    });
    return { data: { ...data, mine: true } };
  }

  async markRead(userId: string, conversationId: string) {
    await this.requireMember(userId, conversationId);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: now },
      }),
      this.prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, readAt: null },
        data: { readAt: now },
      }),
    ]);
    return { data: { readAt: now } };
  }

  async archive(userId: string, conversationId: string) {
    await this.requireMember(userId, conversationId);
    const data = await this.prisma.conversation.update({ where: { id: conversationId }, data: { status: "ARCHIVED" } });
    return { data };
  }

  private async requireMember(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, members: { some: { userId } } },
      select: { id: true, status: true },
    });
    if (!conversation) throw new NotFoundException("Conversation not found.");
    return conversation;
  }
}
