import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import type { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string | undefined, input: CreateSupportTicketDto) {
    const oneHourAgo = new Date(Date.now() - 60 * 60_000);
    const replyEmail = input.email.trim().toLowerCase();
    const recentCount = await this.prisma.supportTicket.count({
      where: {
        ...(userId
          ? { userId }
          : {
              userId: null,
              metadata: { path: ["replyEmail"], equals: replyEmail },
            }),
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentCount >= 4) {
      throw new HttpException(
        "Too many recent support requests. Please wait before sending another.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ticketNumber = `BNC-${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const data = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: userId ?? null,
        subject: this.subject(input.topic),
        category: input.topic.toUpperCase(),
        priority: input.topic === "trust_safety" ? "HIGH" : "NORMAL",
        description: input.message.trim(),
        metadata: {
          contactName: input.name.trim(),
          replyEmail,
          source: "flutter_customer_app",
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });
    return { data };
  }

  async mine(userId: string) {
    const data = await this.prisma.supportTicket.findMany({
      where: { userId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { data };
  }

  private subject(topic: CreateSupportTicketDto["topic"]) {
    return switchTopic(topic);
  }
}

function switchTopic(topic: CreateSupportTicketDto["topic"]) {
  switch (topic) {
    case "account":
      return "Customer account support";
    case "billing":
      return "Order, billing or payment support";
    case "privacy":
      return "Customer privacy request";
    case "trust_safety":
      return "Trust and safety report";
    case "other":
      return "Other customer request";
    default:
      return "General customer support";
  }
}
