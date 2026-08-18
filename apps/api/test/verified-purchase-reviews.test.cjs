require("reflect-metadata");

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const { ReviewsService } = require("../dist/modules/reviews/reviews.service.js");

describe("ReviewsService verified purchase reviews", () => {
  const input = {
    businessId: "business-1",
    orderId: "order-1",
    overallRating: 5,
    body: "The purchased item arrived as described and on time.",
    recommended: true,
  };

  it("marks a completed customer order review as a verified interaction", async () => {
    const created = { id: "review-1", ...input, verifiedInteraction: true, status: "PENDING" };
    const create = jest.fn().mockResolvedValue(created);
    const prisma = {
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1" }) },
      order: { findFirst: jest.fn().mockResolvedValue({ id: "order-1" }) },
      review: { findMany: jest.fn().mockResolvedValue([]), create },
    };
    const service = new ReviewsService(prisma, {}, {});

    await expect(service.create("customer-1", input)).resolves.toEqual({
      data: created,
      message: "Review submitted for integrity checks.",
    });

    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "order-1",
        customerId: "customer-1",
        businessId: "business-1",
        status: { in: ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] },
      }),
    }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        orderId: "order-1",
        verifiedInteraction: true,
        body: "The purchased item arrived as described and on time.",
        overallRating: 5,
      }),
    }));
  });

  it("rejects an order that is not a completed purchase owned by the reviewer", async () => {
    const prisma = {
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1" }) },
      order: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new ReviewsService(prisma, {}, {});

    await expect(service.create("customer-2", input)).rejects.toThrow(
      "Only a completed purchase belonging to you can verify this review.",
    );
  });

  it("has no AI review generator or fabricated-purchase code path", () => {
    const source = readFileSync(join(__dirname, "../src/modules/reviews/reviews.service.ts"), "utf8");
    const controller = readFileSync(join(__dirname, "../src/modules/reviews/reviews.controller.ts"), "utf8");
    const integrityMigration = readFileSync(join(__dirname, "../prisma/migrations/20260816060000_review_integrity_evidence/migration.sql"), "utf8");
    const demoSeed = readFileSync(join(__dirname, "../scripts/seed-live-demo.ts"), "utf8");

    expect(source).not.toMatch(/openai|anthropic|gemini|generateText|chat\.completions|responses\.create/i);
    expect(source).toMatch(/customerId:\s*userId/);
    expect(source).toMatch(/Only a completed purchase belonging to you can verify this review/);
    expect(controller).toMatch(/@Post\(\)[\s\S]*?@UseGuards\(JwtAuthGuard\)[\s\S]*?create\(/);
    expect(integrityMigration).toMatch(/UPDATE "Review"[\s\S]*?"verifiedInteraction" = false/);
    expect(integrityMigration).toMatch(/Review_verifiedInteraction_has_evidence_check/);
    expect(demoSeed).toMatch(/enquiryId:\s*verificationEnquiry\?\.id \?\? null/);
    expect(demoSeed).toMatch(/verifiedInteraction:\s*Boolean\(verificationEnquiry\)/);
  });
});
