require("reflect-metadata");
const { BusinessesService } = require("../dist/modules/businesses/businesses.service.js");

describe("merchant listing ownership and lifecycle", () => {
  it("keeps unpublished listings out of the public business query", async () => {
    const findMany = jest.fn().mockResolvedValue([]), count = jest.fn().mockResolvedValue(0);
    const prisma = { business: { findMany, count }, $transaction: jest.fn(async (operations) => Promise.all(operations)) };
    const service = new BusinessesService(prisma, {}, {}, {}, {});
    await service.list({ page: 1, pageSize: 20 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "ACTIVE", listingStatus: "PUBLISHED" }) }));
  });

  it("rejects cross-merchant listing mutation before reading or updating the listing", async () => {
    const prisma = { business: { findFirst: jest.fn(), update: jest.fn() } };
    const access = { require: jest.fn().mockRejectedValue(new Error("workspace role cannot perform")) };
    const service = new BusinessesService(prisma, {}, access, { activePlan: jest.fn().mockResolvedValue({ descriptionEnabled: true }) }, {});
    await expect(service.listingAction("merchant-b", "listing-a", "ARCHIVE")).rejects.toThrow("workspace role");
    expect(prisma.business.findFirst).not.toHaveBeenCalled();
    expect(prisma.business.update).not.toHaveBeenCalled();
  });

  it("publishes only after ownership and approval checks", async () => {
    const update = jest.fn().mockResolvedValue({ id: "listing-1", listingStatus: "PUBLISHED" });
    const prisma = { business: { findFirst: jest.fn().mockResolvedValue({ id: "listing-1", status: "ACTIVE", verified: true, listingStatus: "DRAFT", publishedAt: null, name: "Local shop", slug: "local-shop", description: "A complete description for this local business listing.", publicPhone: "+919876543210", _count: { categories: 1, locations: 1 } }), update } };
    const access = { require: jest.fn().mockResolvedValue({}), requireApprovedForPublication: jest.fn().mockResolvedValue({}) };
    const service = new BusinessesService(prisma, {}, access, { activePlan: jest.fn().mockResolvedValue({ descriptionEnabled: true }) }, {});
    await service.listingAction("owner-1", "listing-1", "PUBLISH");
    expect(access.require).toHaveBeenCalledWith("owner-1", "listing-1", "business:profile:manage");
    expect(access.requireApprovedForPublication).toHaveBeenCalledWith("listing-1");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ listingStatus: "PUBLISHED" }) }));
  });

  it("retains an existing inactive managed location but rejects a new inactive assignment", async () => {
    const current = {
      id: "listing-1", ownerId: "owner-1", name: "Local shop", slug: "local-shop",
      description: "A complete description for this local business listing.", publicPhone: "+919876543210",
      attributes: {}, categories: [{ categoryId: "category-1" }], services: [], media: [], workingHours: [],
      locations: [{ id: "business-location-1", isPrimary: true, managedLocationId: "inactive-existing" }],
    };
    const businessLocationUpdate = jest.fn().mockResolvedValue({});
    const businessUpdate = jest.fn().mockResolvedValue({ id: "listing-1" });
    const prisma = {
      business: { findUniqueOrThrow: jest.fn().mockResolvedValue(current) },
      managedLocation: { findUnique: jest.fn().mockResolvedValue({ id: "inactive-existing", isActive: false }) },
      $transaction: jest.fn(async (callback) => callback({
        businessLocation: { update: businessLocationUpdate, create: jest.fn() },
        businessOwner: { update: jest.fn() }, workingHour: { deleteMany: jest.fn(), createMany: jest.fn() },
        business: { update: businessUpdate },
      })),
    };
    const access = { require: jest.fn().mockResolvedValue({}) };
    const service = new BusinessesService(prisma, {}, access, {}, {});
    const location = {
      addressLine1: "QA address", locality: "QA locality", city: "QA city", district: "QA district",
      state: "QA state", postalCode: "682030", latitude: 10, longitude: 76, serviceRadiusKm: 5,
      managedLocationId: "inactive-existing",
    };

    await expect(service.update("owner-1", "listing-1", { location })).resolves.toEqual({ data: { id: "listing-1" } });
    expect(businessLocationUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: location }));

    prisma.managedLocation.findUnique.mockResolvedValueOnce({ id: "inactive-new", isActive: false });
    await expect(service.update("owner-1", "listing-1", {
      location: { ...location, managedLocationId: "inactive-new" },
    })).rejects.toThrow("Select an active managed location");
  });
});
