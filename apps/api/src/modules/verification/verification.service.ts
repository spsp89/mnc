import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import type { Prisma } from "../../generated/prisma/client";
import type { UserRole } from "../../generated/prisma/enums";
import type { CreateVerificationRequestDto } from "./dto/create-verification-request.dto";
import type { DecideVerificationDto } from "./dto/decide-verification.dto";
import { MediaService } from "../media/media.service";

const administrativeRoles: UserRole[] = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION"];

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly mediaStorage: MediaService,
  ) {}

  async create(userId: string, input: CreateVerificationRequestDto) {
    await this.businessAccess.require(
      userId,
      input.businessId,
      "business:profile:manage",
    );
    await this.mediaStorage.requireOwnedObjects(
      userId,
      "verification_document",
      input.businessId,
      [input.documentKey],
    );
    const pending = await this.prisma.verificationRequest.findFirst({
      where: { businessId: input.businessId, status: { in: ["PENDING", "IN_REVIEW", "MORE_INFORMATION"] } },
      select: { id: true },
    });
    if (pending) throw new ConflictException("An active verification request already exists.");
    const data = await this.prisma.$transaction(async (transaction) => {
      const request = await transaction.verificationRequest.create({
        data: {
          businessId: input.businessId,
          requestedById: userId,
          documentType: input.documentType,
          documentKey: input.documentKey,
          documentHash: input.documentHash,
        },
      });
      await transaction.business.update({
        where: { id: input.businessId },
        data: { status: "PENDING_VERIFICATION", verified: false },
      });
      return request;
    });
    return { data };
  }

  async mine(userId: string, businessId: string) {
    await this.businessAccess.require(
      userId,
      businessId,
      "business:profile:manage",
    );
    const data = await this.prisma.verificationRequest.findMany({
      where: { businessId },
      select: {
        id: true,
        status: true,
        documentType: true,
        notes: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  }

  async queue(status?: string) {
    const data = await this.prisma.verificationRequest.findMany({
      where: status ? { status: status as "PENDING" } : { status: { in: ["PENDING", "IN_REVIEW", "MORE_INFORMATION"] } },
      select: {
        id: true,
        status: true,
        documentType: true,
        documentHash: true,
        createdAt: true,
        updatedAt: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            owner: { select: { legalName: true } },
            locations: { where: { isPrimary: true }, take: 1, select: { locality: true, city: true, district: true, state: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return { data };
  }

  async find(userId: string, role: UserRole, id: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            owner: { select: { userId: true, legalName: true } },
            members: { where: { userId, active: true }, select: { id: true } },
            locations: { where: { isActive: true } },
          },
        },
        reviewer: { select: { id: true, email: true, role: true } },
      },
    });
    if (!request) throw new NotFoundException("Verification request not found.");
    if (!administrativeRoles.includes(role)) {
      await this.businessAccess.require(
        userId,
        request.businessId,
        "business:view",
      );
    }
    return { data: request };
  }

  async decide(id: string, reviewerId: string, input: DecideVerificationDto, requestId: string) {
    const current = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: { business: { include: { owner: { select: { userId: true } } } } },
    });
    if (!current) throw new NotFoundException("Verification request not found.");
    if (!["PENDING", "IN_REVIEW", "MORE_INFORMATION"].includes(current.status)) {
      throw new ConflictException("This verification request already has a final decision.");
    }
    const result = await this.prisma.$transaction(async (transaction) => {
      const request = await transaction.verificationRequest.update({
        where: { id },
        data: {
          reviewerId,
          status: input.status,
          notes: input.notes,
          rejectionReason: input.status === "REJECTED" ? input.rejectionReason : null,
          reviewedAt: input.status === "MORE_INFORMATION" ? null : new Date(),
        },
      });
      const business = await transaction.business.update({
        where: { id: current.businessId },
        data: input.status === "APPROVED"
          ? { verified: true, status: "ACTIVE", publishedAt: current.business.publishedAt ?? new Date() }
          : input.status === "REJECTED"
            ? { verified: false, status: "REJECTED" }
            : { verified: false, status: "PENDING_VERIFICATION" },
      });
      const previous = await transaction.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { entryHash: true } });
      const after = { requestId: request.id, status: request.status, businessStatus: business.status, verified: business.verified };
      const auditPayload = JSON.stringify({
        reviewerId,
        action: `VERIFICATION_${input.status}`,
        entityId: request.id,
        reason: input.notes,
        after,
        requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          actorId: reviewerId,
          action: `VERIFICATION_${input.status}`,
          entityType: "VerificationRequest",
          entityId: request.id,
          reason: input.notes,
          before: { status: current.status, businessStatus: current.business.status, verified: current.business.verified } as Prisma.InputJsonValue,
          after: after as Prisma.InputJsonValue,
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(auditPayload).digest("hex"),
        },
      });
      await transaction.notification.create({
        data: {
          userId: current.business.owner.userId,
          type: "VERIFICATION_UPDATE",
          channel: "IN_APP",
          title: input.status === "APPROVED" ? "Business verified" : input.status === "REJECTED" ? "Verification was not approved" : "More verification information is needed",
          body: input.notes,
          data: { verificationRequestId: id, businessId: current.businessId },
          sentAt: new Date(),
        },
      });
      return { request, business };
    });
    return { data: result };
  }
}
