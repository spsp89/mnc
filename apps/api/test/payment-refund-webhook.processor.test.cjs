require("reflect-metadata");

const { PaymentWebhookProcessor } = require("../dist/modules/payments/payment-webhook.processor.js");

describe("PaymentWebhookProcessor refund confirmation", () => {
  it("completes a provider refund and derives the payment status only from the signed webhook job", async () => {
    const event = {
      id: "webhook-db-1", eventId: "evt-refund-1", status: "RECEIVED",
      payload: {
        event: "refund.processed",
        payload: { refund: { entity: {
          id: "rfnd_provider_1", payment_id: "pay_provider_1", status: "processed", amount: 50000,
          currency: "INR", receipt: "refund-1", notes: { bnc_refund_id: "refund-1" },
        } } },
      },
    };
    const refund = {
      id: "refund-1", paymentId: "payment-1", amount: 500, status: "PROCESSING",
      payment: { id: "payment-1", providerPaymentId: "pay_provider_1", amount: 1000, status: "CAPTURED" },
    };
    const refundUpdate = jest.fn().mockResolvedValue({ ...refund, status: "COMPLETED" });
    const paymentUpdate = jest.fn().mockResolvedValue({ id: "payment-1", status: "PARTIALLY_REFUNDED" });
    const webhookUpdate = jest.fn().mockResolvedValue({});
    const transaction = {
      refund: { update: refundUpdate, aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500 } }) },
      payment: { update: paymentUpdate },
      webhookEvent: { update: webhookUpdate },
    };
    const prisma = {
      webhookEvent: { findUnique: jest.fn().mockResolvedValue(event), update: jest.fn().mockResolvedValue({}) },
      refund: { findUnique: jest.fn().mockResolvedValue(refund) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    };

    await new PaymentWebhookProcessor(prisma).process({ data: { eventDatabaseId: "webhook-db-1" } });

    expect(refundUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      status: "COMPLETED", providerRefundId: "rfnd_provider_1", completedAt: expect.any(Date),
    }) }));
    expect(paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      status: "PARTIALLY_REFUNDED",
      statusHistory: { create: expect.objectContaining({ source: "RAZORPAY_WEBHOOK", sourceReference: "evt-refund-1" }) },
    }) }));
    expect(webhookUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PROCESSED" }) }));
  });

  it("rejects a refund webhook when the provider amount does not match", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue({ id: "webhook-db-2", eventId: "evt-refund-2", status: "RECEIVED", payload: {
          event: "refund.processed", payload: { refund: { entity: {
            id: "rfnd_provider_2", payment_id: "pay_provider_1", status: "processed", amount: 60000,
            receipt: "refund-1", notes: { bnc_refund_id: "refund-1" },
          } } },
        } }),
        update: jest.fn().mockResolvedValue({}),
      },
      refund: { findUnique: jest.fn().mockResolvedValue({
        id: "refund-1", paymentId: "payment-1", amount: 500,
        payment: { providerPaymentId: "pay_provider_1", amount: 1000, status: "CAPTURED" },
      }) },
      $transaction: jest.fn(),
    };

    await expect(new PaymentWebhookProcessor(prisma).process({ data: { eventDatabaseId: "webhook-db-2" } })).rejects.toThrow("does not match");
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });
});
