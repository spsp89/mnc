import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export const businessCapabilities = [
  "business:view",
  "business:profile:manage",
  "business:team:manage",
  "business:catalog:manage",
  "business:leads:manage",
  "business:orders:manage",
  "business:billing:manage",
  "business:analytics:view",
] as const;

export type BusinessCapability = (typeof businessCapabilities)[number];

const allCapabilities = new Set<BusinessCapability>(businessCapabilities);

export const businessMemberRoles = [
  "ADMIN",
  "MANAGER",
  "CATALOG_EDITOR",
  "LEAD_AGENT",
  "VIEWER",
] as const;

export type BusinessMemberRole = (typeof businessMemberRoles)[number];

const roleCapabilities: Record<BusinessMemberRole, ReadonlySet<BusinessCapability>> = {
  ADMIN: allCapabilities,
  MANAGER: new Set([
    "business:view",
    "business:profile:manage",
    "business:catalog:manage",
    "business:leads:manage",
    "business:orders:manage",
    "business:analytics:view",
  ]),
  CATALOG_EDITOR: new Set([
    "business:view",
    "business:catalog:manage",
  ]),
  LEAD_AGENT: new Set([
    "business:view",
    "business:leads:manage",
    "business:orders:manage",
  ]),
  VIEWER: new Set([
    "business:view",
    "business:analytics:view",
  ]),
};

type BusinessAccess = {
  businessId: string;
  role: "OWNER" | string;
  capabilities: BusinessCapability[];
};

@Injectable()
export class BusinessAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async accessFor(userId: string, businessId: string): Promise<BusinessAccess | null> {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: {
        id: true,
        owner: { select: { userId: true } },
        members: {
          where: { userId, active: true },
          take: 1,
          select: { role: true, permissions: true },
        },
      },
    });
    if (!business) return null;
    if (business.owner.userId === userId) {
      return {
        businessId: business.id,
        role: "OWNER",
        capabilities: [...businessCapabilities],
      };
    }

    const membership = business.members[0];
    if (!membership) return null;
    const role = businessMemberRoles.includes(membership.role as BusinessMemberRole)
      ? membership.role as BusinessMemberRole
      : "VIEWER";
    const allowed = new Set(roleCapabilities[role]);
    const explicit = Array.isArray(membership.permissions)
      ? membership.permissions
      : [];
    for (const permission of explicit) {
      if (
        typeof permission === "string" &&
        allCapabilities.has(permission as BusinessCapability)
      ) {
        allowed.add(permission as BusinessCapability);
      }
    }
    return {
      businessId: business.id,
      role: membership.role,
      capabilities: [...allowed],
    };
  }

  async require(
    userId: string,
    businessId: string,
    capability: BusinessCapability,
  ): Promise<BusinessAccess> {
    const access = await this.accessFor(userId, businessId);
    if (!access?.capabilities.includes(capability)) {
      throw new ForbiddenException(
        "Your business workspace role cannot perform this action.",
      );
    }
    return access;
  }

  async requireApprovedForPublication(businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { status: true, verified: true },
    });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.status !== "ACTIVE" || !business.verified) {
      throw new ConflictException(
        "This merchant account must be approved before listings can be published.",
      );
    }
    return business;
  }

  async businessIdsFor(
    userId: string,
    capability: BusinessCapability,
  ): Promise<string[]> {
    const businesses = await this.prisma.business.findMany({
      where: {
        deletedAt: null,
        OR: [
          { owner: { userId } },
          { members: { some: { userId, active: true } } },
        ],
      },
      select: {
        id: true,
        owner: { select: { userId: true } },
        members: { where: { userId, active: true }, take: 1, select: { role: true, permissions: true } },
      },
    });
    return businesses.filter((business) => {
      if (business.owner.userId === userId) return true;
      const membership = business.members[0];
      if (!membership) return false;
      const role = businessMemberRoles.includes(membership.role as BusinessMemberRole)
        ? membership.role as BusinessMemberRole
        : "VIEWER";
      const allowed = new Set(roleCapabilities[role]);
      if (Array.isArray(membership.permissions)) {
        for (const permission of membership.permissions) {
          if (typeof permission === "string" && allCapabilities.has(permission as BusinessCapability)) {
            allowed.add(permission as BusinessCapability);
          }
        }
      }
      return allowed.has(capability);
    }).map((business) => business.id);
  }
}
