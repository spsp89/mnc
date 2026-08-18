import { createHash, randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { UserRole } from "../src/generated/prisma/enums";

const grantableRoles: UserRole[] = [
  "SUPER_ADMIN",
  "STATE_ADMIN",
  "DISTRICT_ADMIN",
  "AREA_MANAGER",
  "VERIFICATION",
  "MODERATOR",
  "SUPPORT",
  "SALES",
  "FINANCE",
];

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const email = argument("email")?.trim().toLowerCase();
  const requestedRole = argument("role") as UserRole | undefined;
  const reason = argument("reason")?.trim();
  const confirmed = process.argv.includes("--confirm");

  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if (!email) throw new Error("Provide --email for an existing verified BNC user.");
  if (!requestedRole || !grantableRoles.includes(requestedRole)) {
    throw new Error(`Provide --role with one of: ${grantableRoles.join(", ")}.`);
  }
  if (!reason || reason.length < 8) {
    throw new Error("Provide an auditable --reason of at least 8 characters.");
  }
  if (!confirmed) {
    throw new Error("Review the target and rerun with --confirm to apply the role.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        status: "ACTIVE",
        emailVerifiedAt: { not: null },
        deletedAt: null,
      },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new Error("No active, email-verified BNC user matches that address.");
    }

    const assignment = await prisma.$transaction(async (transaction) => {
      const before = await transaction.globalRoleAssignment.findUnique({
        where: { userId_role: { userId: user.id, role: requestedRole } },
      });
      const updated = await transaction.globalRoleAssignment.upsert({
        where: { userId_role: { userId: user.id, role: requestedRole } },
        create: {
          userId: user.id,
          role: requestedRole,
          reason,
          active: true,
        },
        update: {
          reason,
          active: true,
          revokedAt: null,
        },
      });
      const previous = await transaction.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const requestId = randomUUID();
      const payload = JSON.stringify({
        action: "GLOBAL_ROLE_BOOTSTRAPPED",
        entityId: updated.id,
        targetUserId: user.id,
        role: requestedRole,
        reason,
        before,
        after: updated,
        requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          action: "GLOBAL_ROLE_BOOTSTRAPPED",
          entityType: "GlobalRoleAssignment",
          entityId: updated.id,
          reason,
          before: before ?? undefined,
          after: updated,
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(payload).digest("hex"),
        },
      });
      return updated;
    });

    process.stdout.write(
      `Granted ${assignment.role} to ${user.email}. Assignment: ${assignment.id}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Role grant failed."}\n`);
  process.exitCode = 1;
});
