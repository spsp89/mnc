const {
  calculateDistanceKm,
  comparePlanRanking,
  resolveAdministrativeContext,
} = require("../dist/common/location/local-discovery.js");
const {
  SearchService,
} = require("../dist/modules/search/search.service.js");
const {
  ProductsService,
} = require("../dist/modules/products/products.service.js");
const {
  ServicesService,
} = require("../dist/modules/services/services.service.js");
const {
  CategoriesService,
} = require("../dist/modules/categories/categories.service.js");

describe("local discovery helpers", () => {
  it("calculates a real geographic radius instead of a display fallback", () => {
    const kochiToNearby = calculateDistanceKm(9.9681, 76.2999, 9.9781, 76.2999);
    expect(kochiToNearby).toBeGreaterThan(1);
    expect(kochiToNearby).toBeLessThan(1.2);
  });

  it("orders higher plans first and uses earliest plan start as the tie-break", () => {
    const older = { priority: 3, startsAt: new Date("2026-01-01T00:00:00Z") };
    const newer = { priority: 3, startsAt: new Date("2026-02-01T00:00:00Z") };
    const lower = { priority: 2, startsAt: new Date("2025-01-01T00:00:00Z") };
    expect(comparePlanRanking(older, newer)).toBeLessThan(0);
    expect(comparePlanRanking(lower, newer)).toBeGreaterThan(0);
  });

  it("aggregates child catalogue counts into each clickable parent category", async () => {
    const counts = (businessLinks, products, services) => ({
      businessLinks,
      products,
      services,
    });
    const service = new CategoriesService({
      category: {
        findMany: jest.fn().mockResolvedValue([{
          id: "grocery",
          name: "Grocery",
          nameMalayalam: null,
          slug: "grocery",
          _count: counts(1, 0, 0),
          children: [{
            id: "organic",
            name: "Organic & Fresh",
            nameMalayalam: null,
            slug: "grocery-organic-fresh",
            _count: counts(0, 3, 1),
            children: [],
          }],
        }]),
      },
    });

    const result = await service.tree("en");

    expect(result.data[0]._count).toEqual(counts(1, 3, 1));
    expect(result.data[0].children[0]._count).toEqual(counts(0, 3, 1));
  });

  it("resolves constituency, district, and state from the nearest stored location for GPS searches", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{
        constituency: "Ernakulam",
        district: "Ernakulam",
        state: "Kerala",
      }]),
    };

    await expect(resolveAdministrativeContext(prisma, {
      latitude: 9.9681,
      longitude: 76.2999,
    })).resolves.toEqual({
      constituency: "Ernakulam",
      district: "Ernakulam",
      state: "Kerala",
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("keeps subscription reach inside the explicit GPS radius", async () => {
    let captured;
    const service = new SearchService({
      $queryRaw: jest.fn(async (query) => {
        captured = query;
        return [];
      }),
    });

    await service.search({
      latitude: 9.9681,
      longitude: 76.2999,
      constituency: "Ernakulam",
      district: "Ernakulam",
      state: "Kerala",
      page: 1,
      pageSize: 20,
      radiusKm: 5,
      sort: "recommended",
    });

    const sql = captured.strings.join(" ");
    expect(sql).toContain("ST_DWithin");
    expect(captured.values).toContain(5000);
    expect(sql).not.toContain("sp.listing_reach = 'CONSTITUENCY'");
    expect(sql).not.toContain("sp.listing_reach IN ('DISTRICT', 'STATE')");
    expect(sql).not.toContain("sp.listing_reach = 'STATE'");
  });

  it("ranks sponsored products first but never admits a far-away premium product", async () => {
    const product = (id, latitude, plan) => ({
      id,
      name: id,
      price: 100,
      discountPrice: null,
      deliveryOptions: [],
      stockStatus: "IN_STOCK",
      createdAt: new Date("2026-08-01T00:00:00Z"),
      category: { name: "Grocery", slug: "grocery" },
      variants: [],
      media: [],
      business: {
        id: `business-${id}`,
        name: `Business ${id}`,
        slug: `business-${id}`,
        verified: true,
        locations: [{
          locality: "Kochi",
          city: "Kochi",
          constituency: "Ernakulam",
          district: "Ernakulam",
          state: "Kerala",
          latitude,
          longitude: 76.2999,
        }],
        subscriptions: plan ? [{
          startsAt: new Date("2026-01-01T00:00:00Z"),
          plan,
        }] : [],
      },
    });
    const goldPlan = {
      name: "Gold",
      priority: 3,
      starLevel: 3,
      listingReach: "CONSTITUENCY",
      deliveryEnabled: false,
      sponsoredPlacement: true,
    };
    const rubyPlan = {
      name: "Ruby",
      priority: 6,
      starLevel: 6,
      listingReach: "STATE",
      deliveryEnabled: true,
      sponsoredPlacement: true,
    };
    const findMany = jest.fn().mockResolvedValue([
      product("ordinary-nearby", 9.9781),
      product("gold-nearby", 9.9791, goldPlan),
      product("ruby-far-away", 10.0681, rubyPlan),
    ]);
    const service = new ProductsService(
      { product: { findMany } },
      {},
      {},
      {},
    );

    const result = await service.list({
      category: "grocery",
      latitude: 9.9681,
      longitude: 76.2999,
      constituency: "Ernakulam",
      district: "Ernakulam",
      state: "Kerala",
      radiusKm: 5,
      page: 1,
      pageSize: 20,
      sort: "recommended",
    });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        category: {
          OR: expect.arrayContaining([
            { slug: "grocery" },
            { parent: { is: { slug: "grocery" } } },
          ]),
        },
      }),
    }));
    expect(result.data.map((item) => item.id)).toEqual([
      "gold-nearby",
      "ordinary-nearby",
    ]);
    expect(result.data[0]).toEqual(expect.objectContaining({
      sponsored: true,
      planName: "Gold",
      bncStarLevel: 3,
    }));
    expect(result.data.every((item) => item.distanceKm <= 5)).toBe(true);
  });

  it("shows proven courier best sellers beyond the nearby radius in their separate collection", async () => {
    const rubyPlan = {
      name: "Ruby",
      priority: 6,
      starLevel: 6,
      listingReach: "STATE",
      deliveryEnabled: true,
      sponsoredPlacement: true,
    };
    const product = (id, deliveryOptions) => ({
      id,
      name: id,
      price: 500,
      discountPrice: null,
      deliveryOptions,
      stockStatus: "IN_STOCK",
      createdAt: new Date("2026-08-01T00:00:00Z"),
      category: { name: "Grocery", slug: "grocery" },
      variants: [],
      media: [],
      business: {
        id: `business-${id}`,
        name: `Business ${id}`,
        slug: `business-${id}`,
        verified: true,
        locations: [{
          locality: "Thrissur",
          city: "Thrissur",
          constituency: "Thrissur",
          district: "Thrissur",
          state: "Kerala",
          latitude: 10.5276,
          longitude: 76.2144,
        }],
        subscriptions: [{
          startsAt: new Date("2026-01-01T00:00:00Z"),
          plan: rubyPlan,
        }],
      },
    });
    const service = new ProductsService(
      {
        product: { findMany: jest.fn().mockResolvedValue([
          product("courier-winner", ["courier"]),
          product("courier-unsold", ["courier"]),
          product("popular-pickup", ["pickup"]),
        ]) },
        orderItem: { groupBy: jest.fn().mockResolvedValue([
          { productId: "courier-winner", _sum: { quantity: 9 } },
          { productId: "popular-pickup", _sum: { quantity: 20 } },
        ]) },
      },
      {},
      {},
      {},
    );

    const result = await service.list({
      courier: true,
      sort: "best-selling",
      latitude: 9.9681,
      longitude: 76.2999,
      constituency: "Ernakulam",
      district: "Ernakulam",
      state: "Kerala",
      radiusKm: 5,
      page: 1,
      pageSize: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(expect.objectContaining({
      id: "courier-winner",
      courierAvailable: true,
      unitsSold: 9,
    }));
    expect(result.data[0].distanceKm).toBeGreaterThan(5);
  });

  it("shows verified highly rated services beyond the nearby radius in their separate collection", async () => {
    const candidate = (id, verified, averageRating, reviewCount) => ({
      id,
      name: id,
      description: `${id} service`,
      startingPrice: 700,
      pricingType: "STARTING_AT",
      durationMinutes: 60,
      homeService: false,
      createdAt: new Date("2026-08-01T00:00:00Z"),
      category: { id: "category-1", name: "Consultants", slug: "consultants" },
      offers: [],
      media: [],
      business: {
        id: `business-${id}`,
        name: `Business ${id}`,
        slug: `business-${id}`,
        verified,
        averageRating,
        reviewCount,
        locations: [{
          locality: "Thrissur",
          city: "Thrissur",
          constituency: "Thrissur",
          district: "Thrissur",
          state: "Kerala",
          latitude: 10.5276,
          longitude: 76.2144,
        }],
        subscriptions: [],
      },
    });
    const service = new ServicesService(
      { service: { findMany: jest.fn().mockResolvedValue([
        candidate("excellent", true, 4.9, 80),
        candidate("unverified", false, 5, 100),
        candidate("unrated", true, 0, 0),
      ]) } },
      {},
      {},
      {},
    );

    const result = await service.list({
      sort: "top-rated",
      latitude: 9.9681,
      longitude: 76.2999,
      constituency: "Ernakulam",
      district: "Ernakulam",
      state: "Kerala",
      radiusKm: 5,
      page: 1,
      pageSize: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(expect.objectContaining({ id: "excellent" }));
    expect(result.data[0].distanceKm).toBeGreaterThan(5);
  });

  it("applies the advanced customer filters advertised by web and Flutter", async () => {
    let captured;
    const service = new SearchService({
      $queryRaw: jest.fn(async (query) => {
        captured = query;
        return [];
      }),
    });

    await service.search({
      page: 1,
      pageSize: 20,
      radiusKm: 5,
      sort: "price-low",
      delivery: true,
      fastResponse: true,
      priceRange: 2,
      payment: "UPI",
      language: "Malayalam",
      minYears: 5,
    });

    const sql = captured.strings.join(" ");
    expect(sql).toContain('"deliveryOptions"');
    expect(sql).toContain("ARRAY['local_delivery', 'home_delivery', 'courier', 'delivery']");
    expect(sql).toContain("@> '{\"homeDelivery\": true}'::jsonb");
    expect(sql).not.toContain("jsonb_array_length");
    expect(sql).toContain('"medianResponseMinutes"');
    expect(sql).toContain('"priceRange"');
    expect(sql).toContain('"yearsInBusiness"');
    expect(sql).toContain("'paymentMethods'");
    expect(sql).toContain("'languages'");
    expect(sql).toContain("price_range ASC NULLS LAST");
    expect(captured.values).toEqual(
      expect.arrayContaining([true, 2, 5, "UPI", "Malayalam"]),
    );
  });

  it("returns the customer-visible membership and permanent discount fields", async () => {
    const service = new SearchService({
      $queryRaw: jest.fn(async () => [{
        id: "business-1",
        name: "Harbour Electric",
        slug: "harbour-electric",
        short_description: "Trusted local repairs",
        cover_image_url: null,
        public_phone: null,
        verified: true,
        premium: true,
        median_response_minutes: 12,
        price_range: 2,
        years_in_business: 7,
        attributes: {},
        average_rating: "4.8",
        review_count: 42,
        category_name: "Home services",
        category_slug: "home-services",
        locality: "Ernakulam",
        city: "Kochi",
        latitude: "9.9816",
        longitude: "76.2756",
        distance_km: null,
        sponsored: true,
        plan_name: "Local Plus",
        plan_star_level: 4,
        plan_started_at: new Date("2026-01-01T00:00:00Z"),
        permanent_discount_percent: 12,
        permanent_discount_label: "For BNC customers",
        relevance: 1,
        total_count: 1n,
      }]),
    });

    const result = await service.search({
      page: 1,
      pageSize: 20,
      radiusKm: 5,
      sort: "recommended",
    });

    expect(result.data[0]).toEqual(expect.objectContaining({
      bncStarLevel: 4,
      planName: "Local Plus",
      permanentDiscountPercent: 12,
      permanentDiscountLabel: "For BNC customers",
      distanceKm: null,
    }));
  });
});
