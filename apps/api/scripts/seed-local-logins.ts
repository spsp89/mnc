import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";

for (const candidate of [resolve(".env"), resolve("..", "..", ".env")]) {
  if (existsSync(candidate)) config({ path: candidate, override: false });
}

const merchantEmail = "m@bnc.in";
const adminEmail = "a@bnc.in";
const customerEmail = "c@bnc.in";
const password = "Demo@12345";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");

  const verifiedAt = new Date();
  const passwordHash = await hash(password);
  const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

  try {
  const merchant = await prisma.user.upsert({
    where: { email: merchantEmail },
    create: {
      email: merchantEmail,
      passwordHash,
      role: "BUSINESS_OWNER",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
    },
    update: {
      passwordHash,
      role: "BUSINESS_OWNER",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
      deletedAt: null,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: merchant.id },
    create: {
      userId: merchant.id,
      displayName: "Demo Merchant",
      defaultCity: "Kochi",
      defaultState: "Kerala",
    },
    update: {
      displayName: "Demo Merchant",
      defaultCity: "Kochi",
      defaultState: "Kerala",
    },
  });

  const owner = await prisma.businessOwner.upsert({
    where: { userId: merchant.id },
    create: { userId: merchant.id, legalName: "Demo Merchant" },
    update: { legalName: "Demo Merchant" },
  });

  await prisma.business.upsert({
    where: { slug: "demo-merchant" },
    create: {
      ownerId: owner.id,
      name: "Demo Merchant",
      slug: "demo-merchant",
      description: "Local demonstration business for the BNC merchant panel.",
      email: merchantEmail,
      publicPhone: "+91 90000 00001",
      status: "ACTIVE",
      listingStatus: "PUBLISHED",
      verified: true,
    },
    update: {
      ownerId: owner.id,
      name: "Demo Merchant",
      description: "Local demonstration business for the BNC merchant panel.",
      email: merchantEmail,
      publicPhone: "+91 90000 00001",
      status: "ACTIVE",
      listingStatus: "PUBLISHED",
      verified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
    },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
      deletedAt: null,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, displayName: "Demo Admin" },
    update: { displayName: "Demo Admin" },
  });

  await prisma.globalRoleAssignment.upsert({
    where: { userId_role: { userId: admin.id, role: "SUPER_ADMIN" } },
    create: {
      userId: admin.id,
      role: "SUPER_ADMIN",
      reason: "Local demo administrator account",
      active: true,
    },
    update: {
      reason: "Local demo administrator account",
      active: true,
      revokedAt: null,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    create: {
      email: customerEmail,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
    },
    update: {
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
      deletedAt: null,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    create: {
      userId: customer.id,
      displayName: "Demo Customer",
      defaultCity: "Kochi",
      defaultState: "Kerala",
    },
    update: {
      displayName: "Demo Customer",
      defaultCity: "Kochi",
      defaultState: "Kerala",
    },
  });

    process.stdout.write(
      `Local demo logins ready: ${customerEmail}, ${merchantEmail}, and ${adminEmail}.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : "Local demo login seed failed."}\n`,
  );
  process.exitCode = 1;
});
