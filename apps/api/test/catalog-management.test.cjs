require("reflect-metadata");

const { OffersService } = require("../dist/modules/offers/offers.service.js");
const { ProductsService } = require("../dist/modules/products/products.service.js");

describe("business catalogue management", () => {
  it("returns only the selected business offer workspace", async () => {
    const access = { require: jest.fn().mockResolvedValue({}) };
    const prisma = {
      offer: { findMany: jest.fn().mockResolvedValue([{ id: "offer-1" }]) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1" }]) },
      service: { findMany: jest.fn().mockResolvedValue([{ id: "service-1" }]) },
    };
    const service = new OffersService(prisma, access);

    const result = await service.manage("owner-1", "business-1");

    expect(access.require).toHaveBeenCalledWith("owner-1", "business-1", "business:view");
    expect(prisma.offer.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ businessId: "business-1", targetCustomerId: null }),
    }));
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ businessId: "business-1" }),
    }));
    expect(result).toEqual({
      data: [{ id: "offer-1" }],
      catalog: {
        products: [{ id: "product-1" }],
        services: [{ id: "service-1" }],
      },
    });
  });

  it("rejects an offer that references another business catalogue item", async () => {
    const access = { require: jest.fn().mockResolvedValue({}) };
    const prisma = {
      product: { count: jest.fn().mockResolvedValue(0) },
      service: { count: jest.fn().mockResolvedValue(0) },
      offer: { create: jest.fn() },
    };
    const entitlements = {
      assertOfferCapacity: jest.fn().mockResolvedValue({}),
    };
    const service = new OffersService(prisma, access, entitlements);

    await expect(service.create("owner-1", {
      businessId: "business-1",
      title: "Weekend saving",
      description: "A valid local weekend promotion.",
      type: "PERCENTAGE",
      discountValue: 10,
      startsAt: "2026-08-08T00:00:00.000Z",
      endsAt: "2026-08-15T00:00:00.000Z",
      productIds: ["foreign-product"],
    })).rejects.toThrow("Offers can only include products and services owned by this business.");
    expect(prisma.offer.create).not.toHaveBeenCalled();
  });

  it("returns a published product to moderation when its photos change", async () => {
    const productUpdate = jest.fn().mockResolvedValue({});
    const access = { require: jest.fn().mockResolvedValue({}) };
    const media = { requireOwnedObjects: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          businessId: "business-1",
          price: 999,
          status: "PUBLISHED",
        }),
      },
      $transaction: jest.fn(async (callback) => callback({
        product: {
          update: productUpdate,
          findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "product-1", status: "SUBMITTED" }),
        },
        productMedia: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      })),
    };
    const service = new ProductsService(prisma, access, media, {});

    await service.update("owner-1", "product-1", {
      description: "A materially improved product description.",
      media: [{
        objectKey: "quarantine/product/business-1/owner/2026/08/photo.webp",
        mediaType: "image",
        variant: "gallery",
      }],
    });

    expect(media.requireOwnedObjects).toHaveBeenCalled();
    expect(productUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "product-1" },
      data: expect.objectContaining({
        status: "SUBMITTED",
        isActive: false,
        moderationReason: null,
      }),
    }));
  });

  it("stores an explicit home-delivery option on a product draft", async () => {
    const create = jest.fn().mockResolvedValue({ id: "product-1" });
    const access = { require: jest.fn().mockResolvedValue({}) };
    const media = { requireOwnedObjects: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      product: { create },
      businessCategory: { findUnique: jest.fn().mockResolvedValue({ categoryId: "category-1" }) },
    };
    const entitlements = {
      withProductCapacity: jest.fn(async (_businessId, operation) => operation({ product: { create } })),
      requireFeature: jest.fn().mockResolvedValue({}),
    };
    const service = new ProductsService(prisma, access, media, entitlements);

    await service.create("owner-1", {
      businessId: "business-1",
      categoryId: "category-1",
      name: "Delivery-ready product",
      slug: "delivery-ready-product",
      description: "A product that the business can deliver to a customer’s home.",
      price: 999,
      deliveryOptions: ["local_delivery"],
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ deliveryOptions: ["local_delivery"] }),
    }));
    expect(entitlements.withProductCapacity).toHaveBeenCalledWith("business-1", expect.any(Function));
    expect(entitlements.requireFeature).toHaveBeenCalledWith("business-1", "deliveryEnabled");
  });

  it("blocks product submission when the merchant is not approved", async () => {
    const access = {
      require: jest.fn().mockResolvedValue({}),
      requireApprovedForPublication: jest.fn().mockRejectedValue(new Error("merchant must be approved")),
    };
    const update = jest.fn();
    const service = new ProductsService({
      product: {
        findUnique: jest.fn().mockResolvedValue({
          businessId: "business-1", status: "DRAFT", name: "Draft item",
          description: "A complete product description.", price: 100, categoryId: "category-1",
        }),
        update,
      },
    }, access, {}, {});
    await expect(service.submit("owner-1", "product-1")).rejects.toThrow("must be approved");
    expect(access.requireApprovedForPublication).toHaveBeenCalledWith("business-1");
    expect(update).not.toHaveBeenCalled();
  });
});
