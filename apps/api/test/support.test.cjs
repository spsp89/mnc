require("reflect-metadata");

const { SupportService } = require("../dist/modules/support/support.service.js");

describe("SupportService customer tickets", () => {
  it("creates an authenticated customer ticket with reply metadata", async () => {
    const create = jest.fn().mockResolvedValue({
      id: "ticket-1",
      ticketNumber: "BNC-20260807-ABCD1234",
      subject: "Order, billing or payment support",
      category: "BILLING",
      priority: "NORMAL",
      status: "OPEN",
      createdAt: new Date("2026-08-07T00:00:00.000Z"),
    });
    const prisma = {
      supportTicket: {
        count: jest.fn().mockResolvedValue(0),
        create,
      },
    };
    const service = new SupportService(prisma);

    await expect(
      service.create("customer-1", {
        name: "  Anu Customer ",
        email: " ANU@example.com ",
        topic: "billing",
        message: "  I need help with order BNC-1001. ",
      }),
    ).resolves.toEqual({
      data: expect.objectContaining({
        id: "ticket-1",
        category: "BILLING",
      }),
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "customer-1",
        subject: "Order, billing or payment support",
        category: "BILLING",
        priority: "NORMAL",
        description: "I need help with order BNC-1001.",
        metadata: {
          contactName: "Anu Customer",
          replyEmail: "anu@example.com",
          source: "flutter_customer_app",
        },
      }),
      select: expect.objectContaining({
        ticketNumber: true,
        status: true,
      }),
    });
  });

  it("creates a guest ticket and rate-limits by normalized reply email", async () => {
    const count = jest.fn().mockResolvedValue(0);
    const create = jest.fn().mockResolvedValue({
      id: "ticket-guest",
      ticketNumber: "BNC-20260808-EFGH5678",
      subject: "General customer support",
      category: "GENERAL",
      priority: "NORMAL",
      status: "OPEN",
      createdAt: new Date("2026-08-08T00:00:00.000Z"),
    });
    const service = new SupportService({
      supportTicket: { count, create },
    });

    await expect(
      service.create(undefined, {
        name: "  Guest Customer ",
        email: " GUEST@example.com ",
        topic: "general",
        message: "  I need help finding the correct local service. ",
      }),
    ).resolves.toEqual({
      data: expect.objectContaining({
        id: "ticket-guest",
        category: "GENERAL",
      }),
    });
    expect(count).toHaveBeenCalledWith({
      where: {
        userId: null,
        metadata: {
          path: ["replyEmail"],
          equals: "guest@example.com",
        },
        createdAt: { gte: expect.any(Date) },
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        description: "I need help finding the correct local service.",
        metadata: {
          contactName: "Guest Customer",
          replyEmail: "guest@example.com",
          source: "flutter_customer_app",
        },
      }),
      select: expect.objectContaining({
        ticketNumber: true,
        status: true,
      }),
    });
  });

  it("rate limits the fifth ticket created within one hour", async () => {
    const prisma = {
      supportTicket: {
        count: jest.fn().mockResolvedValue(4),
        create: jest.fn(),
      },
    };
    const service = new SupportService(prisma);

    await expect(
      service.create("customer-1", {
        name: "Anu Customer",
        email: "anu@example.com",
        topic: "general",
        message: "I need help with my customer account.",
      }),
    ).rejects.toMatchObject({ status: 429 });
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });
});
