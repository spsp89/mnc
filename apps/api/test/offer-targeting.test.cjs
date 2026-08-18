require("reflect-metadata");

const { OffersService } = require("../dist/modules/offers/offers.service.js");
const { OrdersService } = require("../dist/modules/orders/orders.service.js");

describe("OffersService customer targeting", () => {
  it("keeps private offers out of public and merchant lists while exposing them to the assigned customer", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      offer: { findMany, count },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      service: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (queries) => Promise.all(queries)),
    };
    const service = new OffersService(prisma, { require: jest.fn() }, {});

    await service.list({ page: 1, pageSize: 20 });
    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({ targetCustomerId: null }) }));

    await service.mine("customer-1");
    expect(findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: expect.objectContaining({ targetCustomerId: "customer-1", moderationStatus: "APPROVED" }) }));

    await service.manage("merchant-1", "business-1");
    expect(findMany).toHaveBeenNthCalledWith(3, expect.objectContaining({ where: { businessId: "business-1", targetCustomerId: null } }));
  });

  it("prevents a merchant from editing an admin-targeted offer", async () => {
    const access = { require: jest.fn() };
    const service = new OffersService({ offer: { findUnique: jest.fn().mockResolvedValue({
      businessId: "business-1", targetCustomerId: "customer-1", type: "FLAT", discountValue: 100,
      startsAt: new Date("2026-08-15T12:00:00.000Z"), endsAt: new Date("2027-08-22T12:00:00.000Z"),
    }) } }, access, {});
    await expect(service.update("merchant-1", "offer-1", { title: "Changed" })).rejects.toThrow("only be managed by an administrator");
    expect(access.require).not.toHaveBeenCalled();
  });

  it("does not allow another customer to redeem a targeted coupon", async () => {
    const offerFindFirst = jest.fn().mockResolvedValue(null);
    const service = new OrdersService({
      product: { findMany: jest.fn().mockResolvedValue([{
        id: "product-1", name: "Demo product", price: 500, discountPrice: null, variants: [],
      }]) },
      offer: { findFirst: offerFindFirst },
    }, {});

    await expect(service.create("other-customer", {
      businessId: "business-1", fulfilmentType: "pickup", couponCode: "PRIVATE20",
      items: [{ productId: "product-1", quantity: 1 }],
    })).rejects.toThrow("Coupon is invalid or expired");
    expect(offerFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      couponCode: { equals: "PRIVATE20", mode: "insensitive" },
      OR: [{ targetCustomerId: null }, { targetCustomerId: "other-customer" }],
    }) }));
  });

  it("does not apply a service-only targeted coupon to a product order", async () => {
    const service = new OrdersService({
      product: { findMany: jest.fn().mockResolvedValue([{
        id: "product-1", name: "Demo product", price: 500, discountPrice: null, variants: [],
      }]) },
      offer: { findFirst: jest.fn().mockResolvedValue({
        id: "service-offer", minimumSpend: null, maxRedemptions: 1, redemptionCount: 0,
        products: [], services: [{ serviceId: "service-1" }], discountValue: 20, type: "PERCENTAGE",
      }) },
    }, {});

    await expect(service.create("selected-customer", {
      businessId: "business-1", fulfilmentType: "pickup", couponCode: "SERVICE20",
      items: [{ productId: "product-1", quantity: 1 }],
    })).rejects.toThrow("only valid for the selected services");
  });

  it("notifies only customers within 5 km who have not disabled nearby offers", async () => {
    const notificationCreateMany = jest.fn().mockResolvedValue({ count: 1 });
    const offerUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      savedAddress: {
        findMany: jest.fn().mockResolvedValue([
          { userId: "near-user", latitude: 9.97, longitude: 76.3 },
          { userId: "opted-out-user", latitude: 9.971, longitude: 76.3 },
          { userId: "far-user", latitude: 10.2, longitude: 76.3 },
        ]),
      },
      notificationPreference: {
        findMany: jest.fn().mockResolvedValue([
          { userId: "opted-out-user", inApp: false },
        ]),
      },
      $transaction: jest.fn(async (callback) => callback({
        notification: { createMany: notificationCreateMany },
        offer: { update: offerUpdate },
      })),
    };
    const service = new OffersService(prisma, {});
    const recipients = await service.notifyCustomers({
      id: "offer-1",
      title: "Friday saving",
      startsAt: new Date("2026-08-07T00:00:00Z"),
      business: {
        name: "Nearby Store",
        locations: [{
          latitude: 9.9681,
          longitude: 76.2999,
          city: "Kochi",
          district: "Ernakulam",
          state: "Kerala",
        }],
        subscriptions: [{ plan: { offerReach: "NEARBY_5KM" } }],
      },
    });

    expect(recipients).toBe(1);
    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        id: "nearby-offer-offer-1-near-user",
        userId: "near-user",
        type: "NEARBY_OFFER",
        data: { offerId: "offer-1", reach: "NEARBY_5KM" },
      })],
      skipDuplicates: true,
    });
    expect(offerUpdate).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ targetedCount: 1 }),
    });
  });

  it("uses district matching for the Growth plan reach", async () => {
    const prisma = {
      savedAddress: { findMany: jest.fn().mockResolvedValue([]) },
      notificationPreference: { findMany: jest.fn() },
      $transaction: jest.fn(async (callback) => callback({
        notification: { createMany: jest.fn() },
        offer: { update: jest.fn() },
      })),
    };
    const service = new OffersService(prisma, {});
    await service.notifyCustomers({
      id: "offer-2",
      title: "District offer",
      startsAt: new Date(),
      business: {
        name: "Growth Store",
        locations: [{
          latitude: 9.9681,
          longitude: 76.2999,
          city: "Kochi",
          district: "Ernakulam",
          state: "Kerala",
        }],
        subscriptions: [{ plan: { offerReach: "DISTRICT" } }],
      },
    });

    expect(prisma.savedAddress.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { district: { equals: "Ernakulam", mode: "insensitive" } },
          { city: { equals: "Kochi", mode: "insensitive" } },
        ],
      },
    }));
  });
});
