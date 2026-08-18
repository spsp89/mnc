import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { UserRole } from "../../generated/prisma/enums";

export type ActiveIdentity = {
  id: string;
  role: UserRole;
  roles: UserRole[];
};

@Injectable()
export class ActiveIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async require(userId: string, sessionId: string | undefined): Promise<ActiveIdentity> {
    if (!sessionId) {
      throw new UnauthorizedException("Access session is missing. Sign in again.");
    }

    const session = await this.prisma.refreshSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gte: new Date() },
        user: { status: "ACTIVE", deletedAt: null },
      },
      select: {
        user: {
          select: {
            id: true,
            role: true,
            roleAssignments: {
              where: { active: true, revokedAt: null },
              select: { role: true },
            },
          },
        },
      },
    });
    if (!session) {
      throw new UnauthorizedException("Access session is no longer active.");
    }

    const roles = [...new Set([
      session.user.role,
      ...session.user.roleAssignments.map((assignment) => assignment.role),
    ])];
    return { id: session.user.id, role: session.user.role, roles };
  }
}
