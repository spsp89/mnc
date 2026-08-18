require("reflect-metadata");

const {
  LeadMatchingProcessor,
} = require("../dist/modules/leads/lead-matching.processor.js");
const { LeadsService } = require("../dist/modules/leads/leads.service.js");

describe("LeadMatchingProcessor notifications", () => {
  it("notifies matched business users while respecting the NEW_LEAD opt-out", async () => {
    const notificationCreateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      lead: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "lead-1",
          categoryId: "category-1",
          latitude: 9.9681,
          longitude: 76.2999,
          radiusKm: 5,
          expiresAt: new Date(Date.now() + 60_000),
          enquiry: null,
        }),
      },
      business: {
        findMany: jest.fn().mockResolvedValue([{
          id: "business-1",
          name: "Demo Business",
          verified: true,
          profileCompleteness: 90,
          averageRating: 4.5,
          responseRate: 80,
          owner: { userId: "owner-1" },
          members: [{ userId: "member-opted-out" }],
          locations: [{
            latitude: 9.9691,
            longitude: 76.2999,
            serviceRadiusKm: 5,
          }],
          subscriptions: [{
            id: "subscription-1",
            startsAt: new Date("2026-01-01T00:00:00Z"),
            leadCreditsUsed: 0,
            plan: { priority: 3, leadQuota: 100, automaticLeadAlerts: true },
          }],
        }]),
      },
      notificationPreference: {
        findMany: jest.fn().mockResolvedValue([{
          userId: "member-opted-out",
          inApp: false,
        }]),
      },
      $transaction: jest.fn(async (callback) => callback({
        leadAssignment: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        lead: {
          update: jest.fn().mockResolvedValue({ id: "lead-1" }),
        },
        notification: {
          createMany: notificationCreateMany,
        },
      })),
    };
    const processor = new LeadMatchingProcessor(prisma);

    await expect(processor.process({
      name: "match-lead",
      data: { leadId: "lead-1" },
    })).resolves.toEqual({ matched: 1, notifications: 1 });

    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        id: "new-lead-lead-1-owner-1",
        userId: "owner-1",
        type: "NEW_LEAD",
        channel: "IN_APP",
        data: expect.objectContaining({
          leadId: "lead-1",
          businessId: "business-1",
        }),
      })],
      skipDuplicates: true,
    });
  });

  it("creates a deduplicated privacy-safe lead signal from an authenticated search", async () => {
    const queue = { add: jest.fn().mockResolvedValue({}) };
    const leadCreate = jest.fn().mockResolvedValue({ id: "search-lead-1", status: "NEW" });
    const prisma = {
      category: {
        findFirst: jest.fn().mockResolvedValue({
          id: "category-1",
          name: "Home appliances",
          slug: "home-appliances",
        }),
      },
      lead: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: leadCreate,
      },
    };
    const personalData = { fingerprint: jest.fn().mockReturnValue("search-fingerprint") };
    const service = new LeadsService(queue, prisma, personalData, {});

    await expect(service.createSearchIntent("customer-1", {
      query: "washing machine",
      location: "Kakkanad",
      latitude: 10.0159,
      longitude: 76.3419,
      radiusKm: 5,
      source: "products",
    })).resolves.toEqual({
      data: expect.objectContaining({ id: "search-lead-1", created: true }),
    });

    expect(leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: "customer-1",
        categoryId: "category-1",
        source: "SEARCH_INTENT",
        productQuery: "washing machine",
        contactEncrypted: null,
        radiusKm: 5,
        consentScope: expect.objectContaining({
          contactShared: false,
          notificationOnly: true,
        }),
      }),
      select: { id: true, status: true },
    });
    expect(queue.add).toHaveBeenCalledWith(
      "match-lead",
      { leadId: "search-lead-1" },
      expect.objectContaining({ jobId: "match:search-lead-1" }),
    );
  });

  it("delivers search-demand notifications without consuming lead credits", async () => {
    const assignmentCreateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      lead: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "search-lead-2",
          source: "SEARCH_INTENT",
          categoryId: "category-1",
          latitude: 9.9681,
          longitude: 76.2999,
          radiusKm: 5,
          expiresAt: new Date(Date.now() + 60_000),
          enquiry: null,
        }),
      },
      business: {
        findMany: jest.fn().mockResolvedValue([{
          id: "business-1",
          name: "Demo Business",
          verified: true,
          profileCompleteness: 90,
          averageRating: 4.5,
          responseRate: 80,
          owner: { userId: "owner-1" },
          members: [],
          locations: [{
            latitude: 9.9691,
            longitude: 76.2999,
            serviceRadiusKm: 5,
          }],
          subscriptions: [{
            id: "subscription-1",
            startsAt: new Date("2026-01-01T00:00:00Z"),
            leadCreditsUsed: 100,
            plan: { priority: 3, leadQuota: 100, automaticLeadAlerts: true },
          }],
        }]),
      },
      notificationPreference: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (callback) => callback({
        leadAssignment: { createMany: assignmentCreateMany },
        lead: { update: jest.fn().mockResolvedValue({}) },
        notification: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      })),
    };
    const processor = new LeadMatchingProcessor(prisma);

    await expect(processor.process({
      name: "match-lead",
      data: { leadId: "search-lead-2" },
    })).resolves.toEqual({ matched: 1, notifications: 1 });

    expect(assignmentCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ creditCost: 0 })],
      skipDuplicates: true,
    });
  });
});
