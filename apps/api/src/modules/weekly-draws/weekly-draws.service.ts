import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateWeeklyDrawDto } from "./dto/create-weekly-draw.dto";
import type { ClaimDrawEntryDto, IssueDrawEntryDto } from "./dto/draw-entry.dto";

type DrawTicket = {
  referenceId: string;
  referenceNumber: string;
  orderId?: string;
  entryId?: string;
  userId: string;
  source: "COMPLETED_ORDER" | "MERCHANT_CODE" | "APP_ACTIVITY";
  activityOrdinal: number;
};

@Injectable()
export class WeeklyDrawsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly config: ConfigService,
  ) {}

  async publicDraws() {
    if (!this.enabled) return { data: [], meta: { enabled: false } };
    const data = await this.prisma.weeklyDraw.findMany({
      where: { status: { in: ["OPEN", "PUBLISHED"] } },
      include: {
        winnerOrder: { select: { orderNumber: true } },
        winnerEntry: { select: { codeLast4: true } },
        winnerUser: { select: { customerProfile: { select: { displayName: true, defaultCity: true } } } },
      },
      orderBy: { weekStartsAt: "desc" },
      take: 12,
    });
    return {
      data: data.map((draw) => ({
        ...draw,
        winner: draw.status === "PUBLISHED" && draw.winnerUser
          ? {
              name: draw.winnerUser.customerProfile?.displayName ?? "BNC customer",
              city: draw.winnerUser.customerProfile?.defaultCity ?? "Kerala",
              orderNumber: draw.winnerOrder?.orderNumber ?? (draw.winnerEntry ? `CODE-••••-${draw.winnerEntry.codeLast4}` : null),
            }
          : null,
        audit: draw.status === "PUBLISHED" && draw.selectionHash
          ? {
              algorithm: draw.selectionAlgorithm,
              candidateHash: draw.candidateHash,
              selectionSeed: draw.selectionSeed,
              selectionHash: draw.selectionHash,
              selectionIndex: draw.selectionIndex,
              candidateCount: draw.candidateCount,
              usageEventCount: draw.usageEventCount,
            }
          : null,
        eligibilitySnapshot: undefined,
        selectionSeed: undefined,
        winnerUser: undefined,
        winnerOrder: undefined,
        winnerEntry: undefined,
        winnerUserId: undefined,
      })),
    };
  }

  async adminList() {
    const data = await this.prisma.weeklyDraw.findMany({
      include: {
        winnerOrder: { select: { orderNumber: true } },
        winnerEntry: { select: { codeLast4: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { weekStartsAt: "desc" },
      take: 100,
    });
    return { data, meta: { enabled: this.enabled, approvalReference: this.enabled ? this.config.get<string>("DRAW_LEGAL_APPROVAL_REFERENCE") : null } };
  }

  async create(input: CreateWeeklyDrawDto) {
    const weekStartsAt = new Date(input.weekStartsAt);
    const weekEndsAt = new Date(input.weekEndsAt);
    if (weekEndsAt <= weekStartsAt) throw new BadRequestException("The draw end must be after its start.");
    const data = await this.prisma.weeklyDraw.create({
      data: { ...input, weekStartsAt, weekEndsAt },
    });
    return { data };
  }

  async issueEntry(userId: string, drawId: string, input: IssueDrawEntryDto) {
    this.requireEnabled();
    await this.businessAccess.require(userId, input.businessId, "business:orders:manage");
    const draw = await this.require(drawId);
    const now = new Date();
    if (draw.status !== "OPEN" || draw.weekStartsAt > now || draw.weekEndsAt < now) {
      throw new ConflictException("Reward IDs can only be issued during an open draw period.");
    }
    if (input.purchaseAmount < Number(draw.minimumPurchase)) {
      throw new BadRequestException(`This draw requires a purchase of at least ₹${Number(draw.minimumPurchase).toFixed(0)}.`);
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const raw = randomBytes(6).toString("hex").toUpperCase().slice(0, 8);
      const code = `BNC-${raw.slice(0, 4)}-${raw.slice(4)}`;
      try {
        const data = await this.prisma.drawEntry.create({
          data: {
            drawId,
            businessId: input.businessId,
            issuedById: userId,
            purchaseAmount: input.purchaseAmount,
            receiptReference: input.receiptReference?.trim() || null,
            codeHash: this.codeHash(code),
            codeLast4: raw.slice(4),
          },
          include: { draw: { select: { title: true, kind: true, weekEndsAt: true } } },
        });
        return { data: { ...data, code } };
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
    throw new ConflictException("A unique reward ID could not be generated. Please retry.");
  }

  async claimEntry(userId: string, input: ClaimDrawEntryDto) {
    this.requireEnabled();
    const normalized = input.code.trim().toUpperCase();
    const entry = await this.prisma.drawEntry.findUnique({
      where: { codeHash: this.codeHash(normalized) },
      include: { draw: true, business: { select: { name: true, slug: true } } },
    });
    if (!entry) throw new NotFoundException("Reward ID was not found.");
    if (entry.status === "CLAIMED") {
      if (entry.customerId === userId) return { data: entry };
      throw new ConflictException("This reward ID has already been claimed.");
    }
    if (entry.status !== "ISSUED" || entry.draw.status !== "OPEN" || entry.draw.weekEndsAt < new Date()) {
      throw new ConflictException("This reward ID is no longer claimable.");
    }
    const data = await this.prisma.drawEntry.update({
      where: { id: entry.id },
      data: { customerId: userId, status: "CLAIMED", claimedAt: new Date() },
      include: {
        draw: { select: { title: true, kind: true, weekEndsAt: true, prizeDescription: true } },
        business: { select: { name: true, slug: true } },
      },
    });
    return { data };
  }

  async entriesForBusiness(userId: string, drawId: string, businessId: string) {
    this.requireEnabled();
    await this.businessAccess.require(userId, businessId, "business:orders:manage");
    const data = await this.prisma.drawEntry.findMany({
      where: { drawId, businessId },
      select: {
        id: true,
        codeLast4: true,
        purchaseAmount: true,
        receiptReference: true,
        status: true,
        issuedAt: true,
        claimedAt: true,
        customer: { select: { customerProfile: { select: { displayName: true } } } },
      },
      orderBy: { issuedAt: "desc" },
      take: 500,
    });
    return { data };
  }

  async myEntries(userId: string) {
    if (!this.enabled) return { data: [], meta: { enabled: false } };
    const data = await this.prisma.drawEntry.findMany({
      where: { customerId: userId, status: "CLAIMED" },
      include: {
        draw: { select: { title: true, kind: true, status: true, weekEndsAt: true, prizeDescription: true } },
        business: { select: { name: true, slug: true } },
      },
      orderBy: { claimedAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async open(id: string) {
    this.requireEnabled();
    const draw = await this.require(id);
    if (draw.status !== "DRAFT") throw new ConflictException("Only a draft draw can be opened.");
    const data = await this.prisma.weeklyDraw.update({ where: { id }, data: { status: "OPEN" } });
    return { data };
  }

  async selectWinner(id: string) {
    this.requireEnabled();
    const draw = await this.require(id);
    if (draw.status !== "OPEN") throw new ConflictException("Only an open draw can select a winner.");
    if (draw.weekEndsAt > new Date()) throw new ConflictException("The eligibility period has not ended.");
    const eligibleOrders = await this.prisma.order.findMany({
      where: {
        status: "DELIVERED",
        total: { gte: draw.minimumPurchase },
        createdAt: { gte: draw.weekStartsAt, lte: draw.weekEndsAt },
        payments: { some: { status: "CAPTURED" } },
      },
      select: { id: true, orderNumber: true, customerId: true },
      orderBy: { createdAt: "asc" },
      take: 100_000,
    });
    const claimedEntries = await this.prisma.drawEntry.findMany({
      where: { drawId: id, status: "CLAIMED", customerId: { not: null } },
      select: { id: true, codeLast4: true, customerId: true },
      orderBy: { claimedAt: "asc" },
      take: 100_000,
    });
    if (!eligibleOrders.length && !claimedEntries.length) {
      throw new NotFoundException("No eligible purchases or claimed merchant reward IDs were found.");
    }
    const userIds = [...new Set([
      ...eligibleOrders.map((order) => order.customerId),
      ...claimedEntries.flatMap((entry) => entry.customerId ? [entry.customerId] : []),
    ])];
    const activity = await this.prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        occurredAt: { gte: draw.weekStartsAt, lte: draw.weekEndsAt },
      },
      _count: { _all: true },
    });
    const activityByUser = new Map(
      activity
        .filter((row) => row.userId)
        .map((row) => [row.userId!, row._count._all]),
    );
    const ordersByUser = new Map<string, typeof eligibleOrders>();
    for (const order of eligibleOrders) {
      const orders = ordersByUser.get(order.customerId) ?? [];
      orders.push(order);
      ordersByUser.set(order.customerId, orders);
    }
    const tickets: DrawTicket[] = eligibleOrders.map((order) => ({
      referenceId: order.id,
      referenceNumber: order.orderNumber,
      orderId: order.id,
      userId: order.customerId,
      source: "COMPLETED_ORDER",
      activityOrdinal: 0,
    }));
    for (const entry of claimedEntries) {
      if (!entry.customerId) continue;
      tickets.push({
        referenceId: entry.id,
        referenceNumber: `CODE-••••-${entry.codeLast4}`,
        entryId: entry.id,
        userId: entry.customerId,
        source: "MERCHANT_CODE",
        activityOrdinal: 0,
      });
    }
    let usageEventCount = 0;
    for (const [userId, eventCount] of activityByUser) {
      usageEventCount += eventCount;
      const bonusCount = Math.min(Math.floor(eventCount / 5), 10);
      const userOrders = ordersByUser.get(userId) ?? [];
      for (let index = 0; index < bonusCount && userOrders.length; index += 1) {
        const order = userOrders[index % userOrders.length]!;
        tickets.push({
          referenceId: order.id,
          referenceNumber: order.orderNumber,
          orderId: order.id,
          userId,
          source: "APP_ACTIVITY",
          activityOrdinal: index + 1,
        });
      }
    }
    const canonicalSnapshot = JSON.stringify(tickets);
    const candidateHash = createHash("sha256").update(canonicalSnapshot).digest("hex");
    const selectionSeed = randomBytes(32).toString("hex");
    const selectionHash = createHmac("sha256", selectionSeed)
      .update(`${draw.id}:${candidateHash}:${tickets.length}`)
      .digest("hex");
    const selectionIndex = Number(BigInt(`0x${selectionHash.slice(0, 16)}`) % BigInt(tickets.length));
    const winningTicket = tickets[selectionIndex]!;
    const winnerUserId = winningTicket.userId;
    const selectedAt = new Date();
    const data = await this.prisma.$transaction(async (transaction) => {
      const selected = await transaction.weeklyDraw.update({
        where: { id },
        data: {
          status: "DRAWN",
          winnerOrderId: winningTicket.orderId ?? null,
          winnerEntryId: winningTicket.entryId ?? null,
          winnerUserId,
          selectedAt,
          eligibilitySnapshot: tickets,
          candidateHash,
          selectionSeed,
          selectionHash,
          selectionIndex,
          candidateCount: tickets.length,
          usageEventCount,
          selectionAlgorithm: "HMAC_SHA256_V1",
        },
      });
      await transaction.notification.create({
        data: {
          userId: winnerUserId,
          type: "WEEKLY_DRAW",
          channel: "IN_APP",
          title: "You won the BNC weekly draw",
          body: `${draw.prizeDescription} · winning entry ${winningTicket.referenceNumber}`,
          data: { drawId: draw.id, referenceNumber: winningTicket.referenceNumber },
          sentAt: selectedAt,
        },
      });
      return selected;
    });
    return {
      data: {
        ...data,
        eligibleOrderCount: eligibleOrders.length,
        claimedMerchantCodeCount: claimedEntries.length,
        candidateCount: tickets.length,
        usageEventCount,
        winningOrderNumber: winningTicket.referenceNumber,
        audit: {
          algorithm: "HMAC_SHA256_V1",
          candidateHash,
          selectionSeed,
          selectionHash,
          selectionIndex,
        },
      },
    };
  }

  async publish(id: string) {
    this.requireEnabled();
    const draw = await this.require(id);
    if (draw.status !== "DRAWN") throw new ConflictException("Select a winner before publishing.");
    const data = await this.prisma.weeklyDraw.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    return { data };
  }

  private async require(id: string) {
    const draw = await this.prisma.weeklyDraw.findUnique({ where: { id } });
    if (!draw) throw new NotFoundException("Weekly draw not found.");
    return draw;
  }

  private codeHash(code: string) {
    const secret = this.config.getOrThrow<string>("DRAW_CODE_SECRET");
    return createHmac("sha256", secret).update(code.trim().toUpperCase()).digest("hex");
  }

  private get enabled() {
    return this.config.get<boolean>("DRAW_FEATURE_ENABLED", false) === true;
  }

  private requireEnabled() {
    if (!this.enabled) throw new ServiceUnavailableException("Reward draws are disabled until legal and tax approval is configured.");
  }
}
