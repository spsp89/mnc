require("reflect-metadata");

const { PaymentsService } = require("../dist/modules/payments/payments.service.js");
const { ServicesService } = require("../dist/modules/services/services.service.js");

describe("business workspace management", () => {
  it("loads only services owned by the selected workspace", async () => {
    const access = { require: jest.fn().mockResolvedValue({}) };
    const prisma = {
      service: { findMany: jest.fn().mockResolvedValue([{ id: "service-1" }]) },
    };
    const service = new ServicesService(prisma, access, {}, {});

    const result = await service.manage("owner-1", "business-1");

    expect(access.require).toHaveBeenCalledWith("owner-1", "business-1", "business:view");
    expect(prisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { businessId: "business-1", deletedAt: null },
    }));
    expect(result).toEqual({ data: [{ id: "service-1" }] });
  });

  it("scopes payments, subscriptions, and settlements to the selected business", async () => {
    const access = { require: jest.fn().mockResolvedValue({}) };
    const paymentFindMany = jest.fn().mockResolvedValue([{ id: "payment-1" }]);
    const settlementFindMany = jest.fn().mockResolvedValue([{ id: "settlement-1" }]);
    const aggregate = jest.fn().mockResolvedValue({ _sum: { amount: 4500 }, _count: { _all: 2 } });
    const prisma = {
      payment: { findMany: paymentFindMany, aggregate },
      settlement: { findMany: settlementFindMany },
      $transaction: jest.fn(async (operations) => Promise.all(operations)),
    };
    const service = new PaymentsService(prisma, {}, access);

    const result = await service.listForBusiness("owner-1", "business-1");

    expect(access.require).toHaveBeenCalledWith("owner-1", "business-1", "business:billing:manage");
    expect(paymentFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { order: { businessId: "business-1" } },
          { subscription: { businessId: "business-1" } },
        ],
      },
    }));
    expect(settlementFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { businessId: "business-1" },
    }));
    expect(result.data.summary).toEqual({ capturedCount: 2, capturedAmount: 4500 });
  });
});
