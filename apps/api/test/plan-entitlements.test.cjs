require("reflect-metadata");

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const {
  PlanEntitlementsService,
} = require("../dist/common/subscriptions/plan-entitlements.service.js");

const plan = (overrides = {}) => ({
  id: "plan-bronze",
  slug: "bronze",
  name: "Bronze",
  priority: 1,
  starLevel: 1,
  listingReach: "NEARBY_5KM",
  offerReach: "NEARBY_5KM",
  productLimit: 3,
  mediaLimit: 0,
  categoryLimit: 1,
  descriptionEnabled: false,
  socialLinksEnabled: false,
  bookingEnabled: false,
  deliveryEnabled: false,
  automaticLeadAlerts: false,
  ...overrides,
});

const prismaFor = (activePlan, counts = {}) => ({
  businessSubscription: {
    findFirst: jest.fn().mockResolvedValue(
      activePlan ? { plan: activePlan } : null,
    ),
  },
  product: { count: jest.fn().mockResolvedValue(counts.products ?? 0) },
  businessMedia: {
    count: jest.fn().mockResolvedValue(counts.galleryPhotos ?? 0),
  },
  businessCategory: {
    count: jest.fn().mockResolvedValue(counts.categories ?? 0),
  },
  offer: { count: jest.fn().mockResolvedValue(counts.offers ?? 0) },
});

describe("BNC membership plan entitlements", () => {
  it("migrates the exact six supplied prices and catalogue limits", () => {
    const sql = readFileSync(
      join(__dirname, "../prisma/migrations/20260814150000_six_business_membership_plans/migration.sql"),
      "utf8",
    ).replace(/\s+/g, " ");

    for (const row of [
      "'Bronze', 'bronze', 1, 1, 'NEARBY_5KM', 'NEARBY_5KM', 499, 4999, 20, 3, 0, 1, 1, 1, false, false, false, false, false, false, false",
      "'Silver', 'silver', 2, 2, 'CONSTITUENCY', 'NEARBY_5KM', 999, 9999, 50, 10, 5, 3, 1, 2, true, true, false, false, false, false, false",
      "'Gold', 'gold', 3, 3, 'CONSTITUENCY', 'NEARBY_5KM', 2999, 29999, 100, 30, 15, 6, 1, 3, true, true, false, false, false, true, true",
      "'Platinum', 'platinum', 4, 4, 'CONSTITUENCY', 'NEARBY_5KM', 4999, 49999, 200, 50, 25, 10, 1, 5, true, true, true, true, false, true, true",
      "'Diamond', 'diamond', 5, 5, 'DISTRICT', 'DISTRICT', 9999, 99999, 500, 100, 50, 15, 1, 10, true, true, true, true, true, true, true",
      "'Ruby', 'ruby', 6, 6, 'STATE', 'STATE', 14999, 149999, NULL, 150, 75, 20, 1, 15, true, true, true, true, true, true, true",
    ]) {
      expect(sql).toContain(row);
    }
  });

  it("requires an active paid plan before catalogue management", async () => {
    const service = new PlanEntitlementsService(prismaFor(null));

    await expect(service.requirePlan("business-1")).rejects.toThrow(
      "Activate a Bronze, Silver, Gold, Platinum, Diamond or Ruby plan",
    );
  });

  it("enforces the Bronze limits of three products, no gallery, and one category", async () => {
    const prisma = prismaFor(plan(), {
      products: 3,
      galleryPhotos: 0,
      categories: 1,
    });
    const service = new PlanEntitlementsService(prisma);

    await expect(service.assertProductCapacity("business-1")).rejects.toThrow(
      "Bronze allows 3 products",
    );
    await expect(service.assertGalleryCapacity("business-1")).rejects.toThrow(
      "Bronze does not include gallery photos",
    );
    await expect(
      service.assertCategoryCapacity("business-1", 2),
    ).rejects.toThrow("Bronze allows 1 category");
  });

  it("blocks description, social, booking, delivery, and automatic leads when absent from a plan", async () => {
    const service = new PlanEntitlementsService(prismaFor(plan()));

    for (const [feature, label] of [
      ["descriptionEnabled", "Business descriptions"],
      ["socialLinksEnabled", "Social media links"],
      ["bookingEnabled", "Booking"],
      ["deliveryEnabled", "Delivery integration"],
      ["automaticLeadAlerts", "Automatic lead alerts"],
    ]) {
      await expect(
        service.requireFeature("business-1", feature),
      ).rejects.toThrow(`${label} is not included in the Bronze plan`);
    }
  });

  it("allows every premium feature on Diamond and Ruby", async () => {
    for (const premiumPlan of [
      plan({
        id: "plan-diamond",
        slug: "diamond",
        name: "Diamond",
        priority: 5,
        starLevel: 5,
        listingReach: "DISTRICT",
        offerReach: "DISTRICT",
        productLimit: 100,
        mediaLimit: 50,
        categoryLimit: 15,
        descriptionEnabled: true,
        socialLinksEnabled: true,
        bookingEnabled: true,
        deliveryEnabled: true,
        automaticLeadAlerts: true,
      }),
      plan({
        id: "plan-ruby",
        slug: "ruby",
        name: "Ruby",
        priority: 6,
        starLevel: 6,
        listingReach: "STATE",
        offerReach: "STATE",
        productLimit: 150,
        mediaLimit: 75,
        categoryLimit: 20,
        descriptionEnabled: true,
        socialLinksEnabled: true,
        bookingEnabled: true,
        deliveryEnabled: true,
        automaticLeadAlerts: true,
      }),
    ]) {
      const service = new PlanEntitlementsService(prismaFor(premiumPlan));
      for (const feature of [
        "descriptionEnabled",
        "socialLinksEnabled",
        "bookingEnabled",
        "deliveryEnabled",
        "automaticLeadAlerts",
      ]) {
        await expect(
          service.requireFeature("business-1", feature),
        ).resolves.toEqual(premiumPlan);
      }
    }
  });

  it("returns usage for products, gallery photos, and categories", async () => {
    const silver = plan({
      id: "plan-silver",
      slug: "silver",
      name: "Silver",
      priority: 2,
      starLevel: 2,
      listingReach: "CONSTITUENCY",
      productLimit: 10,
      mediaLimit: 5,
      categoryLimit: 3,
      descriptionEnabled: true,
      socialLinksEnabled: true,
    });
    const service = new PlanEntitlementsService(
      prismaFor(silver, { products: 4, galleryPhotos: 2, categories: 3, offers: 1 }),
    );

    await expect(service.usage("business-1")).resolves.toEqual({
      plan: silver,
      products: { used: 4, limit: 10 },
      galleryPhotos: { used: 2, limit: 5 },
      categories: { used: 3, limit: 3 },
      offers: { used: 1, limit: silver.offerLimit },
    });
  });

  it("serializes concurrent product creates before rechecking the plan limit", async () => {
    let used = 2;
    let lockTail = Promise.resolve();
    const lockCalls = jest.fn();
    const activePlan = plan({ productLimit: 3 });
    const prisma = {
      $transaction: jest.fn(async (callback) => {
        let releaseLock;
        const transaction = {
          businessSubscription: {
            findFirst: jest.fn().mockResolvedValue({ plan: activePlan }),
          },
          product: {
            count: jest.fn(async () => used),
            create: jest.fn(async () => ({ id: `product-${++used}` })),
          },
          businessMedia: { count: jest.fn() },
          businessCategory: { count: jest.fn() },
          offer: { count: jest.fn() },
          $queryRaw: jest.fn(async (...query) => {
            lockCalls(...query);
            const previous = lockTail;
            lockTail = new Promise((resolve) => { releaseLock = resolve; });
            await previous;
            return [{ pg_advisory_xact_lock: null }];
          }),
        };
        try {
          return await callback(transaction);
        } finally {
          releaseLock?.();
        }
      }),
    };
    const service = new PlanEntitlementsService(prisma);
    const create = () => service.withProductCapacity(
      "business-1",
      (transaction) => transaction.product.create({ data: {} }),
    );

    const results = await Promise.allSettled([create(), create()]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason.message)
      .toContain("Bronze allows 3 products");
    expect(used).toBe(3);
    expect(lockCalls).toHaveBeenCalledTimes(2);
  });
});
