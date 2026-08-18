const { createHmac } = require("node:crypto");
const { WhatsAppDispatchProcessor } = require("../dist/modules/notifications/whatsapp-dispatch.processor.js");
const { WhatsAppWebhookService } = require("../dist/modules/notifications/whatsapp-webhook.service.js");

const secret = "whatsapp-webhook-test-secret";

function sourceNotification() {
  return {
    id: "source-1",
    userId: "user-1",
    type: "ORDER_UPDATE",
    channel: "IN_APP",
    title: "Order update",
    body: "Your order is ready.",
    user: { phone: "+919876543210" },
  };
}

function dispatcher(consents) {
  const upsert = jest.fn().mockResolvedValue({ id: "whatsapp-source-1", data: {}, sentAt: null });
  const update = jest.fn().mockResolvedValue({});
  const prisma = {
    notification: {
      findMany: jest.fn().mockResolvedValueOnce([sourceNotification()]).mockResolvedValueOnce([]),
      upsert,
      update,
    },
    notificationPreference: { findMany: jest.fn().mockResolvedValue([{ userId: "user-1", type: "ORDER_UPDATE" }]) },
    consent: { findMany: jest.fn().mockResolvedValue(consents) },
  };
  const provider = {
    configured: true,
    templateFor: jest.fn().mockReturnValue("order_update_v1"),
    send: jest.fn().mockResolvedValue({ providerMessageId: "wamid-1", templateName: "order_update_v1" }),
  };
  const config = { get: jest.fn((_key, fallback) => fallback) };
  return { processor: new WhatsAppDispatchProcessor(prisma, provider, config, {}), prisma, provider, upsert, update };
}

describe("WhatsApp consent and template dispatch", () => {
  it("does not create or send a WhatsApp message without current explicit consent", async () => {
    const { processor, provider, upsert } = dispatcher([]);
    await expect(processor.dispatchPending()).resolves.toEqual(expect.objectContaining({ sent: 0, skipped: 1 }));
    expect(upsert).not.toHaveBeenCalled();
    expect(provider.send).not.toHaveBeenCalled();
  });

  it("sends only through an approved template after preference and scoped consent", async () => {
    const { processor, provider, update } = dispatcher([{
      userId: "user-1",
      granted: true,
      withdrawnAt: null,
      scope: { notificationTypes: ["ORDER_UPDATE"] },
    }]);
    await expect(processor.dispatchPending()).resolves.toEqual(expect.objectContaining({ sent: 1, failed: 0 }));
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({ type: "ORDER_UPDATE", notificationId: "whatsapp-source-1" }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sentAt: expect.any(Date), failedAt: null }) }));
  });
});

function webhookSetup() {
  const webhookCreate = jest.fn().mockResolvedValue({ id: "event-row-1" });
  const webhookUpdate = jest.fn().mockResolvedValue({});
  const consentCreate = jest.fn().mockResolvedValue({});
  const preferenceUpdate = jest.fn().mockResolvedValue({ count: 2 });
  const prisma = {
    webhookEvent: { create: webhookCreate, update: webhookUpdate },
    user: { findUnique: jest.fn().mockResolvedValue({ id: "user-1" }) },
    notification: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (callback) => callback({
      consent: { create: consentCreate },
      notificationPreference: { updateMany: preferenceUpdate },
      webhookEvent: { update: webhookUpdate },
      notification: { update: jest.fn() },
    })),
  };
  const config = { get: jest.fn((key, fallback) => ({ WHATSAPP_PROVIDER: "HTTP", WHATSAPP_WEBHOOK_SECRET: secret })[key] ?? fallback) };
  return { service: new WhatsAppWebhookService(prisma, config), webhookCreate, consentCreate, preferenceUpdate };
}

describe("WhatsApp callback integrity and opt-out", () => {
  it("rejects a spoofed callback before storing it", async () => {
    const { service, webhookCreate } = webhookSetup();
    const payload = { event: "message.delivered", clientReference: "whatsapp-source-1" };
    await expect(service.receive("bad", "event-1", Buffer.from(JSON.stringify(payload)), payload)).rejects.toThrow("Invalid WhatsApp webhook signature");
    expect(webhookCreate).not.toHaveBeenCalled();
  });

  it("records STOP as withdrawn consent and disables every WhatsApp preference", async () => {
    const { service, consentCreate, preferenceUpdate } = webhookSetup();
    const payload = { event: "message.received", from: "+919876543210", text: "STOP" };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    await expect(service.receive(`sha256=${signature}`, "event-2", rawBody, payload)).resolves.toEqual({ received: true, optedOut: true });
    expect(consentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ granted: false, withdrawnAt: expect.any(Date) }) }));
    expect(preferenceUpdate).toHaveBeenCalledWith({ where: { userId: "user-1" }, data: { whatsapp: false } });
  });
});
