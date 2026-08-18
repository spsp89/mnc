require("reflect-metadata");

const { createHmac } = require("node:crypto");
const { PaymentWebhookService } = require("../dist/modules/payments/payment-webhook.service.js");

describe("PaymentWebhookService", () => {
  const secret = "razorpay-webhook-test-secret";
  const payload = Buffer.from(JSON.stringify({ event: "payment.captured", payload: {} }));

  function setup(create = jest.fn().mockResolvedValue({ id: "webhook-db-1" })) {
    const prisma = { webhookEvent: { create } };
    const config = { get: jest.fn((name) => name === "RAZORPAY_WEBHOOK_SECRET" ? secret : undefined) };
    const queue = { add: jest.fn().mockResolvedValue({ id: "job-1" }) };
    return { service: new PaymentWebhookService(prisma, config, queue), create, queue };
  }

  it("authenticates raw bytes, stores an idempotency record, and queues async work", async () => {
    const { service, create, queue } = setup();
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    await expect(service.accept(payload, signature, "evt-101")).resolves.toEqual({ accepted: true });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ eventId: "evt-101", eventType: "payment.captured" }),
    }));
    expect(queue.add).toHaveBeenCalledWith("process", { eventDatabaseId: "webhook-db-1" }, expect.any(Object));
  });

  it("rejects a webhook before persistence when its signature is invalid", async () => {
    const { service, create, queue } = setup();
    await expect(service.accept(payload, "invalid", "evt-102")).rejects.toThrow("Invalid webhook signature");
    expect(create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("acknowledges provider retries without enqueueing the event twice", async () => {
    const duplicate = jest.fn().mockRejectedValue(new Error("Unique constraint failed"));
    const { service, queue } = setup(duplicate);
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    await expect(service.accept(payload, signature, "evt-101")).resolves.toEqual({ accepted: true, duplicate: true });
    expect(queue.add).not.toHaveBeenCalled();
  });
});
