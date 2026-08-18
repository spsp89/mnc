const { createHmac } = require("node:crypto");
const { DeliveriesService } = require("../dist/modules/deliveries/deliveries.service.js");

const secret = "delivery-webhook-test-secret";

function signed(payload) {
  const rawBody = Buffer.from(JSON.stringify(payload));
  return {
    rawBody,
    signature: createHmac("sha256", secret).update(rawBody).digest("hex"),
  };
}

function setup(overrides = {}) {
  const webhookCreate = overrides.webhookCreate ?? jest.fn().mockResolvedValue({ id: "webhook-1" });
  const webhookUpdate = jest.fn().mockResolvedValue({});
  const shipmentUpdate = jest.fn().mockResolvedValue({ id: "shipment-1", status: "IN_TRANSIT" });
  const orderUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
  const prisma = {
    webhookEvent: { create: webhookCreate, update: webhookUpdate },
    deliveryShipment: {
      findFirst: jest.fn().mockResolvedValue(overrides.shipment ?? {
        id: "shipment-1",
        orderId: "order-1",
        provider: "HTTP",
        providerRef: "provider-1",
        status: "ASSIGNED",
        trackingUrl: null,
        driverName: null,
        driverPhone: null,
        vehicleNumber: null,
      }),
    },
    $transaction: jest.fn(async (callback) => callback({
      webhookEvent: { update: webhookUpdate },
      deliveryShipment: { update: shipmentUpdate },
      order: { update: jest.fn().mockResolvedValue({}), updateMany: orderUpdateMany },
    })),
  };
  const config = {
    get: jest.fn((key) => ({
      DELIVERY_PROVIDER: "HTTP",
      DELIVERY_API_BASE_URL: "https://delivery.example.test",
      DELIVERY_API_TOKEN: "provider-token",
      DELIVERY_WEBHOOK_SECRET: secret,
    })[key]),
  };
  const service = new DeliveriesService(prisma, {}, config, {}, {});
  return { service, prisma, webhookCreate, webhookUpdate, shipmentUpdate, orderUpdateMany };
}

describe("delivery webhook integrity", () => {
  it("rejects a callback before persistence when the raw-body HMAC is invalid", async () => {
    const { service, webhookCreate } = setup();
    const payload = { id: "provider-1", status: "in_transit" };

    await expect(service.webhook("HTTP", "bad-signature", "event-1", Buffer.from(JSON.stringify(payload)), payload))
      .rejects.toThrow("Invalid delivery webhook signature");
    expect(webhookCreate).not.toHaveBeenCalled();
  });

  it("persists an authenticated event and advances shipment state transactionally", async () => {
    const { service, webhookCreate, webhookUpdate, shipmentUpdate, orderUpdateMany } = setup();
    const payload = { id: "provider-1", status: "in_transit", tracking_url: "https://track.example.test/1" };
    const { rawBody, signature } = signed(payload);

    await expect(service.webhook("http", `sha256=${signature}`, "event-2", rawBody, payload))
      .resolves.toEqual(expect.objectContaining({ received: true }));
    expect(webhookCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ provider: "DELIVERY_HTTP", eventId: "event-2", eventType: "in_transit" }),
    }));
    expect(shipmentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "IN_TRANSIT", trackingUrl: "https://track.example.test/1" }),
    }));
    expect(orderUpdateMany).toHaveBeenCalled();
    expect(webhookUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PROCESSED", attempts: { increment: 1 } }),
    }));
  });

  it("acknowledges duplicate event IDs and ignores regressions from terminal state", async () => {
    const duplicate = setup({ webhookCreate: jest.fn().mockRejectedValue({ code: "P2002" }) });
    const payload = { id: "provider-1", status: "requested" };
    const { rawBody, signature } = signed(payload);
    await expect(duplicate.service.webhook("HTTP", signature, "event-3", rawBody, payload))
      .resolves.toEqual({ received: true, duplicate: true });
    expect(duplicate.prisma.deliveryShipment.findFirst).not.toHaveBeenCalled();

    const terminal = setup({ shipment: {
      id: "shipment-1",
      orderId: "order-1",
      provider: "HTTP",
      providerRef: "provider-1",
      status: "DELIVERED",
      trackingUrl: null,
      driverName: null,
      driverPhone: null,
      vehicleNumber: null,
    } });
    await expect(terminal.service.webhook("HTTP", signature, "event-4", rawBody, payload))
      .resolves.toEqual(expect.objectContaining({ received: true, data: expect.objectContaining({ status: "DELIVERED" }) }));
    expect(terminal.shipmentUpdate).not.toHaveBeenCalled();
    expect(terminal.webhookUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "IGNORED" }),
    }));
  });
});
