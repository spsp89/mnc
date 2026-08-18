require("reflect-metadata");

const { EnquiriesService } = require("../dist/modules/enquiries/enquiries.service.js");
const { AnalyticsService } = require("../dist/modules/analytics/analytics.service.js");
const { AdminService } = require("../dist/modules/admin/admin.service.js");

describe("merchant enquiry isolation and optimized dashboards", () => {
  it("builds the enquiry query from the authenticated listing and never a frontend merchant id", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      business: { findUnique: jest.fn().mockResolvedValue({ id: "business-1", name: "Owned", slug: "owned" }) },
      enquiry: { findMany, count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (operations) => Promise.all(operations)),
    };
    const access = { require: jest.fn().mockResolvedValue({}) };
    const service = new EnquiriesService(prisma, {}, {}, access);

    await service.listForBusiness("merchant-1", { businessId: "business-1", q: "roofing", page: 1, pageSize: 25 });

    expect(access.require).toHaveBeenCalledWith("merchant-1", "business-1", "business:leads:manage");
    const where = findMany.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain("business-1");
    expect(JSON.stringify(where)).not.toContain("business-2");
  });

  it("rejects a status update when the enquiry is not assigned to that merchant listing", async () => {
    const upsert = jest.fn();
    const prisma = { enquiry: { findFirst: jest.fn().mockResolvedValue(null) }, merchantEnquiryState: { upsert } };
    const service = new EnquiriesService(prisma, {}, {}, { require: jest.fn().mockResolvedValue({}) });

    await expect(service.updateMerchantStatus("merchant-1", "enquiry-1", { businessId: "business-1", status: "CONTACTED" })).rejects.toThrow("Enquiry not found for this business listing");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("uses count, groupBy and aggregate queries for merchant KPIs rather than loading complete tables", async () => {
    const count = jest.fn().mockResolvedValue(0);
    const groupBy = jest.fn().mockResolvedValue([]);
    const prisma = {
      business: { count }, offer: { count }, enquiry: { count }, leadAssignment: { count },
      analyticsEvent: { groupBy }, businessSubscription: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (operations) => Promise.all(operations)),
    };
    const access = { require: jest.fn().mockResolvedValue({}), businessIdsFor: jest.fn().mockResolvedValue(["business-1"]) };
    const service = new AnalyticsService(prisma, access);

    await expect(service.merchantDashboard("merchant-1", "business-1")).resolves.toEqual(expect.objectContaining({ data: expect.objectContaining({ totalListings: 0, leadsReceived: 0 }) }));
    expect(groupBy).toHaveBeenCalled();
    expect(prisma.business.findMany).toBeUndefined();
    expect(prisma.enquiry.findMany).toBeUndefined();
  });

  it("builds admin reports from aggregate queries and configured plan records", async () => {
    const paymentCount = jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(3);
    const subscriptionCount = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const prisma = {
      business: { count: jest.fn().mockResolvedValue(3) }, offer: { count: jest.fn().mockResolvedValue(2) },
      enquiry: { count: jest.fn().mockResolvedValue(4) },
      payment: { count: paymentCount, aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1250 } }) },
      businessSubscription: { count: subscriptionCount, groupBy: jest.fn().mockResolvedValue([{ planId: "gold", _count: { _all: 2 } }]) },
      subscriptionPlan: { findMany: jest.fn().mockResolvedValue([{ id: "gold", name: "Gold", displayOrder: 3 }]) },
      $transaction: jest.fn(async (operations) => Promise.all(operations)),
    };
    const service = new AdminService(prisma);

    const result = await service.reportSummary({ from: "2026-08-01T00:00:00.000Z", to: "2026-08-31T23:59:59.000Z" });
    expect(result.data.subscriptionDistribution).toEqual([{ planId: "gold", name: "Gold", count: 2 }]);
    expect(result.data).toEqual(expect.objectContaining({
      merchantsInRange: 3, listingsInRange: 3, offersInRange: 2, enquiries: 4,
      paymentsInRange: 5, capturedPaymentsInRange: 3, capturedPaymentValueInRange: 1250,
      subscriptionsInRange: 1, activeSubscriptions: 2,
    }));
    expect(prisma.payment.aggregate).toHaveBeenCalledWith({
      where: { status: "CAPTURED", createdAt: { gte: new Date("2026-08-01T00:00:00.000Z"), lte: new Date("2026-08-31T23:59:59.000Z") } },
      _sum: { amount: true },
    });
    expect(prisma.business.findMany).toBeUndefined();
    expect(prisma.offer.findMany).toBeUndefined();
    expect(prisma.enquiry.findMany).toBeUndefined();
  });
});
