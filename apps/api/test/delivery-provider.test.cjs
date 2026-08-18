const {
  ManualDeliveryProvider,
} = require("../dist/modules/deliveries/delivery-provider.js");
const {
  DeliveriesService,
} = require("../dist/modules/deliveries/deliveries.service.js");

describe("delivery provider adapter", () => {
  it("offers a deterministic manual fallback without pretending an external provider is configured", async () => {
    const provider = new ManualDeliveryProvider();
    const request = {
      orderId: "order-1",
      orderNumber: "BNC-001",
      pickup: {},
      drop: {},
      items: [{ name: "Local product", quantity: 1 }],
      currentDeliveryFee: 80,
    };

    await expect(provider.quote(request)).resolves.toEqual(expect.objectContaining({
      amount: 80,
      status: "QUOTED",
      raw: expect.objectContaining({ mode: "manual" }),
    }));
    await expect(provider.create(request)).resolves.toEqual(expect.objectContaining({
      providerRef: "manual-order-1",
      status: "REQUESTED",
    }));
  });

  it("requires owned private proof, completes the order and prepares settlement", async () => {
    const proofUpsert = jest.fn().mockResolvedValue({ id: "proof-1", receiverName: "Customer" });
    const settlementUpsert = jest.fn().mockResolvedValue({});
    const notificationCreate = jest.fn().mockResolvedValue({});
    const prisma = {
      deliveryShipment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "shipment-1",
          orderId: "order-1",
          businessId: "business-1",
          customerId: "customer-1",
          status: "IN_TRANSIT",
          quotedAmount: 70,
          currency: "INR",
          proof: null,
          settlement: null,
          order: {
            orderNumber: "BNC-001",
            deliveryFee: 100,
            total: 500,
            status: "DISPATCHED",
          },
        }),
      },
      $transaction: jest.fn(async (callback) => callback({
        deliveryProof: { upsert: proofUpsert },
        deliveryShipment: { update: jest.fn().mockResolvedValue({}) },
        order: { update: jest.fn().mockResolvedValue({}) },
        deliverySettlement: { upsert: settlementUpsert },
        notification: { create: notificationCreate },
      })),
    };
    const access = { require: jest.fn().mockResolvedValue({}) };
    const config = { get: jest.fn((key) => key === "DELIVERY_PROVIDER" ? "MANUAL" : undefined) };
    const media = { requireOwnedObjects: jest.fn().mockResolvedValue(undefined) };
    const service = new DeliveriesService(prisma, access, config, media);

    const result = await service.captureProof("owner-1", "order-1", {
      objectKey: "private/delivery/business-1/owner/2026/08/proof.webp",
      receiverName: "Customer",
      notes: "Received in good condition",
    });

    expect(result.data.id).toBe("proof-1");
    expect(media.requireOwnedObjects).toHaveBeenCalledWith(
      "owner-1",
      "delivery_proof",
      "business-1",
      ["private/delivery/business-1/owner/2026/08/proof.webp"],
    );
    expect(settlementUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        status: "READY",
        grossAmount: 100,
        providerFee: 70,
        netPayable: 30,
      }),
    }));
    expect(notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "customer-1", type: "ORDER_UPDATE" }),
    });
  });
});
