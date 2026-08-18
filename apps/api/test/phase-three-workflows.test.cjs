require("reflect-metadata");

const { WeeklyDrawsService } = require("../dist/modules/weekly-draws/weekly-draws.service.js");
const { BookingsService } = require("../dist/modules/bookings/bookings.service.js");
const { BusinessClubService } = require("../dist/modules/business-club/business-club.service.js");
const { ConversationsService } = require("../dist/modules/conversations/conversations.service.js");

describe("Phase three workflows", () => {
  it("selects a winner only from delivered, captured purchase-order IDs", async () => {
    const drawUpdate = jest.fn().mockResolvedValue({ id: "draw-1", status: "DRAWN" });
    const notificationCreate = jest.fn().mockResolvedValue({});
    const prisma = {
      weeklyDraw: {
        findUnique: jest.fn().mockResolvedValue({
          id: "draw-1",
          title: "Weekly draw",
          prizeDescription: "Voucher",
          status: "OPEN",
          minimumPurchase: 200,
          weekStartsAt: new Date("2026-07-01T00:00:00Z"),
          weekEndsAt: new Date("2026-07-08T00:00:00Z"),
        }),
      },
      drawEntry: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      order: {
        findMany: jest.fn().mockResolvedValue([
          { id: "order-1", orderNumber: "BNC-001", customerId: "customer-1" },
        ]),
      },
      analyticsEvent: {
        groupBy: jest.fn().mockResolvedValue([
          { userId: "customer-1", _count: { _all: 12 } },
        ]),
      },
      $transaction: jest.fn(async (callback) => callback({
        weeklyDraw: { update: drawUpdate },
        notification: { create: notificationCreate },
      })),
    };
    const config = { get: jest.fn((key, fallback) => key === "DRAW_FEATURE_ENABLED" ? true : fallback), getOrThrow: jest.fn().mockReturnValue("draw-test-secret-that-is-longer-than-32-characters") };
    const service = new WeeklyDrawsService(prisma, {}, config);
    const result = await service.selectWinner("draw-1");

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: "DELIVERED",
        payments: { some: { status: "CAPTURED" } },
      }),
    }));
    expect(result.data.winningOrderNumber).toBe("BNC-001");
    expect(result.data.candidateCount).toBe(3);
    expect(result.data.usageEventCount).toBe(12);
    expect(result.data.audit).toEqual(expect.objectContaining({
      algorithm: "HMAC_SHA256_V1",
      selectionIndex: expect.any(Number),
    }));
    expect(notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "customer-1", type: "WEEKLY_DRAW" }),
    });
  });

  it("blocks draw activation when legal and tax approval is not configured", async () => {
    const prisma = { weeklyDraw: { findUnique: jest.fn(), update: jest.fn() } };
    const config = { get: jest.fn((_key, fallback) => fallback), getOrThrow: jest.fn() };
    const service = new WeeklyDrawsService(prisma, {}, config);

    await expect(service.open("draw-1")).rejects.toThrow("disabled until legal and tax approval");
    expect(prisma.weeklyDraw.findUnique).not.toHaveBeenCalled();
    expect(prisma.weeklyDraw.update).not.toHaveBeenCalled();
  });

  it("prevents overlapping appointment slots for the same provider", async () => {
    const prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: "service-1",
          name: "Consultation",
          durationMinutes: 30,
          business: { name: "Clinic", owner: { userId: "owner-1" } },
        }),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([
          { startsAt: new Date("2026-09-01T10:00:00Z"), durationMinutes: 30 },
        ]),
      },
    };
    const entitlements = { requireFeature: jest.fn().mockResolvedValue({}) };
    const service = new BookingsService(prisma, {}, entitlements);
    await expect(service.create("customer-1", {
      businessId: "business-1",
      serviceId: "service-1",
      providerName: "Dr Demo",
      startsAt: "2026-09-01T10:15:00Z",
    })).rejects.toThrow("already reserved");
  });

  it("requires one of the top two BNC plans before joining Business Club", async () => {
    const prisma = {
      clubChapter: { findFirst: jest.fn().mockResolvedValue({ id: "chapter-1" }) },
      businessSubscription: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const access = { require: jest.fn().mockResolvedValue({}) };
    const service = new BusinessClubService(prisma, access);
    await expect(service.join("user-1", "chapter-1", "business-1"))
      .rejects.toThrow("active 5-star and 6-star BNC plans");
  });

  it("generates public booking slots from provider schedules and removes reserved times", async () => {
    const tomorrow = new Date(Date.now() + 48 * 60 * 60_000)
      .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({ durationMinutes: 30 }),
      },
      bookingSchedule: {
        findMany: jest.fn().mockResolvedValue([
          {
            providerId: "provider-1",
            startsMinute: 600,
            endsMinute: 690,
            slotIntervalMinutes: 30,
            provider: { id: "provider-1", name: "Dr BNC", title: "Doctor" },
          },
        ]),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            providerId: "provider-1",
            startsAt: new Date(new Date(`${tomorrow}T00:00:00+05:30`).getTime() + 630 * 60_000),
            durationMinutes: 30,
          },
        ]),
      },
      bookingTimeOff: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const entitlements = { activePlan: jest.fn().mockResolvedValue({ bookingEnabled: true }) };
    const service = new BookingsService(prisma, {}, entitlements);
    const result = await service.availabilitySlots("business-1", "service-1", tomorrow);

    expect(result.data).toHaveLength(2);
    expect(result.data.map((slot) => slot.provider.name)).toEqual(["Dr BNC", "Dr BNC"]);
    expect(result.data.map((slot) => new Date(slot.startsAt).toISOString().slice(11, 16)))
      .toEqual(["04:30", "05:30"]);
  });

  it("publishes member-created Business Club events after membership verification", async () => {
    const eventCreate = jest.fn().mockResolvedValue({ id: "event-1", status: "PUBLISHED" });
    const prisma = {
      clubMembership: {
        findFirst: jest.fn().mockResolvedValue({ id: "membership-1" }),
      },
      clubEvent: { create: eventCreate },
    };
    const service = new BusinessClubService(prisma, {});
    const result = await service.createEvent("user-1", "chapter-1", {
      title: "Member meetup",
      description: "A practical B2B referral meetup.",
      venue: "BNC chapter hall",
      startsAt: "2026-09-01T10:00:00Z",
      endsAt: "2026-09-01T12:00:00Z",
      capacity: 30,
    });

    expect(result.data.status).toBe("PUBLISHED");
    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        chapterId: "chapter-1",
        createdById: "user-1",
        capacity: 30,
        status: "PUBLISHED",
      }),
    });
  });

  it("delivers the two-hour booking reminder once", async () => {
    const notificationCreate = jest.fn().mockResolvedValue({});
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const startsAt = new Date(Date.now() + 60 * 60_000);
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "booking-1",
          customerId: "customer-1",
          status: "CONFIRMED",
          startsAt,
          providerName: null,
          reminder24hSentAt: new Date(),
          reminder2hSentAt: null,
          business: { name: "BNC Clinic" },
          service: { name: "Consultation" },
          provider: { name: "Dr BNC" },
        }),
      },
      $transaction: jest.fn(async (callback) => callback({
        notification: { create: notificationCreate },
        booking: { update: bookingUpdate },
      })),
    };
    const service = new BookingsService(prisma, {}, {});
    const result = await service.deliverReminder("booking-1", "2h");

    expect(result.skipped).toBe(false);
    expect(notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringContaining("booking-reminder-booking-1-2h"),
        type: "BOOKING_REMINDER",
        userId: "customer-1",
      }),
    });
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { reminder2hSentAt: expect.any(Date) },
    });
  });

  it("starts a direct in-app business conversation without WhatsApp", async () => {
    const messageCreate = jest.fn().mockResolvedValue({});
    const notificationCreate = jest.fn().mockResolvedValue({});
    const prisma = {
      business: {
        findFirst: jest.fn().mockResolvedValue({
          id: "business-1",
          name: "BNC Business",
          owner: { userId: "owner-1" },
        }),
      },
      conversation: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback({
        conversation: {
          create: jest.fn().mockResolvedValue({ id: "conversation-1" }),
        },
        message: { create: messageCreate },
        notification: { create: notificationCreate },
      })),
    };
    const service = new ConversationsService(prisma, {});
    const result = await service.create("customer-1", {
      businessId: "business-1",
      initialMessage: "Hello from BNC.",
    });

    expect(result.data.id).toBe("conversation-1");
    expect(messageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conversationId: "conversation-1",
        senderId: "customer-1",
        body: "Hello from BNC.",
      }),
    });
    expect(notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "owner-1",
        data: expect.objectContaining({ conversationId: "conversation-1" }),
      }),
    });
  });
});
