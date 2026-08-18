require("reflect-metadata");

const { AdminService } = require("../dist/modules/admin/admin.service.js");
const { SubscriptionsService } = require("../dist/modules/subscriptions/subscriptions.service.js");

describe("subscription management", () => {
  it("rejects an inactive plan before creating a new merchant subscription", async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = new SubscriptionsService(
      { subscriptionPlan: { findFirst } },
      { require: jest.fn().mockResolvedValue({}) },
    );

    await expect(service.create("merchant-1", {
      businessId: "business-1",
      planId: "bronze",
      billingCycle: "monthly",
    })).rejects.toThrow("Subscription plan not found.");
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "bronze", isActive: true } });
  });

  it("creates paid plan selections as pending without activating or marking a payment paid", async () => {
    const create = jest.fn().mockResolvedValue({ id: "sub-1", status: "PENDING_PAYMENT", plan: { name: "Gold" } });
    const prisma = {
      subscriptionPlan: { findFirst: jest.fn().mockResolvedValue({ id: "gold", name: "Gold", annualPrice: 1000, monthlyPrice: 100, productLimit: 30, mediaLimit: 15, categoryLimit: 6, offerLimit: 5 }) },
      product: { count: jest.fn().mockResolvedValue(1) }, businessMedia: { count: jest.fn().mockResolvedValue(1) },
      businessCategory: { count: jest.fn().mockResolvedValue(1) }, offer: { count: jest.fn().mockResolvedValue(1) },
      businessSubscription: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback({ businessSubscription: { create, updateMany: jest.fn() } })),
    };
    const access = { require: jest.fn().mockResolvedValue({}) };
    const service = new SubscriptionsService(prisma, access);

    await expect(service.create("merchant-1", { businessId: "business-1", planId: "gold", billingCycle: "monthly" })).resolves.toEqual(expect.objectContaining({ checkoutRequired: true }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PENDING_PAYMENT", renewalStatus: "PAYMENT_PENDING", source: "CHECKOUT" }) }));
    expect(prisma.payment).toBeUndefined();
  });

  it("records an admin assignment as a grant without fabricating payment history", async () => {
    const created = { id: "sub-admin-1", status: "ACTIVE", source: "ADMIN_GRANT" };
    const transaction = {
      businessSubscription: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), create: jest.fn().mockResolvedValue(created) },
      auditLog: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Merchant" }) },
      subscriptionPlan: { findFirst: jest.fn().mockResolvedValue({ id: "silver", name: "Silver", isActive: true, productLimit: 10, mediaLimit: 5, categoryLimit: 3, offerLimit: 2 }) },
      product: { count: jest.fn().mockResolvedValue(0) }, businessMedia: { count: jest.fn().mockResolvedValue(0) },
      businessCategory: { count: jest.fn().mockResolvedValue(0) }, offer: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    };
    const service = new AdminService(prisma);

    await expect(service.assignSubscription({ businessId: "business-1", planId: "silver", billingCycle: "annual", durationDays: 365, reason: "Approved annual partnership grant." }, "admin-1", "request-1")).resolves.toEqual({ data: created });
    expect(transaction.businessSubscription.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ source: "ADMIN_GRANT", assignedById: "admin-1", autoRenew: false }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "SUBSCRIPTION_ADMIN_ASSIGNED" }) }));
    expect(transaction.payment).toBeUndefined();
  });

  it("changes an assigned plan without fabricating a gateway payment", async () => {
    const updated = { id: "sub-1", planId: "silver", status: "ACTIVE", source: "ADMIN_OVERRIDE" };
    const transaction = {
      businessSubscription: { update: jest.fn().mockResolvedValue(updated) },
      auditLog: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      businessSubscription: { findUnique: jest.fn().mockResolvedValue({ id: "sub-1", businessId: "business-1", currentPeriodEnd: new Date("2026-09-15T00:00:00Z"), plan: { id: "bronze", name: "Bronze" } }) },
      subscriptionPlan: { findFirst: jest.fn().mockResolvedValue({ id: "silver", name: "Silver", isActive: true, productLimit: 10, mediaLimit: 5, categoryLimit: 3, offerLimit: 2 }) },
      product: { count: jest.fn().mockResolvedValue(0) }, businessMedia: { count: jest.fn().mockResolvedValue(0) },
      businessCategory: { count: jest.fn().mockResolvedValue(0) }, offer: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    };
    const service = new AdminService(prisma);

    await expect(service.updateSubscription("sub-1", { action: "CHANGE_PLAN", planId: "silver", reason: "Approved audited upgrade." }, "admin-1", "request-1")).resolves.toEqual({ data: updated });
    expect(transaction.businessSubscription.update).toHaveBeenCalledWith(expect.objectContaining({ data: { planId: "silver", source: "ADMIN_OVERRIDE", assignedById: "admin-1" } }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "SUBSCRIPTION_ADMIN_CHANGE_PLAN" }) }));
    expect(transaction.payment).toBeUndefined();
  });

  it("cancels renewal intent without changing an active subscription into a fake payment state", async () => {
    const update = jest.fn().mockResolvedValue({ id: "sub-1", status: "ACTIVE", autoRenew: false, renewalStatus: "CANCELLED" });
    const prisma = { businessSubscription: { findUnique: jest.fn().mockResolvedValue({ businessId: "business-1", status: "ACTIVE" }), update } };
    const service = new SubscriptionsService(prisma, { require: jest.fn().mockResolvedValue({}) });

    await service.cancel("merchant-1", "sub-1");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "ACTIVE", autoRenew: false, renewalStatus: "CANCELLED" }) }));
  });
});
