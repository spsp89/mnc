require("reflect-metadata");

const { AnalyticsService } = require("../dist/modules/analytics/analytics.service.js");

describe("Analytics event integrity", () => {
  const input = {
    eventType: "PROFILE_VIEW",
    sessionId: "session-public-123",
    businessId: "business-1",
    source: "business_profile",
  };

  it("persists an event only for an active public business", async () => {
    const created = { id: "event-1", eventType: "PROFILE_VIEW", occurredAt: new Date() };
    const prisma = {
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1" }) },
      category: { findFirst: jest.fn() },
      analyticsEvent: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
      },
    };
    const service = new AnalyticsService(prisma, {});

    await expect(service.track(input)).resolves.toEqual({ data: created, deduplicated: false });
    expect(prisma.business.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "business-1",
        status: "ACTIVE",
        listingStatus: "PUBLISHED",
        deletedAt: null,
      }),
    }));
  });

  it("rejects business engagement without a target", async () => {
    const service = new AnalyticsService({}, {});
    await expect(service.track({
      eventType: "CALL_CLICK",
      sessionId: "session-public-123",
    })).rejects.toThrow("requires a business target");
  });

  it("rejects disabled, unpublished, deleted, or unknown targets", async () => {
    const prisma = {
      business: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new AnalyticsService(prisma, {});
    await expect(service.track(input)).rejects.toThrow("target is unavailable");
  });

  it("deduplicates an immediate retry instead of inflating the metric", async () => {
    const existing = { id: "event-existing", eventType: "PROFILE_VIEW", occurredAt: new Date() };
    const prisma = {
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1" }) },
      category: { findFirst: jest.fn() },
      analyticsEvent: {
        findFirst: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
      },
    };
    const service = new AnalyticsService(prisma, {});

    await expect(service.track(input)).resolves.toEqual({ data: existing, deduplicated: true });
    expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
  });
});
