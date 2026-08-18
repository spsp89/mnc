import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import type { Queue } from "bullmq";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PlanEntitlementsService } from "../../common/subscriptions/plan-entitlements.service";
import { PrismaService } from "../../database/prisma.service";
import type {
  CreateBookingProviderDto,
  CreateBookingScheduleDto,
  CreateBookingTimeOffDto,
  RescheduleBookingDto,
} from "./dto/booking-setup.dto";
import type { CreateBookingDto } from "./dto/create-booking.dto";
import type { UpdateBookingDto } from "./dto/update-booking.dto";

export const BOOKING_REMINDER_QUEUE = "booking-reminders";

type ReminderKind = "24h" | "2h";
type ReminderJob = { bookingId: string; kind: ReminderKind };

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly planEntitlements: PlanEntitlementsService,
    @Optional()
    @InjectQueue(BOOKING_REMINDER_QUEUE)
    private readonly reminderQueue?: Queue<ReminderJob>,
  ) {}

  async mine(userId: string) {
    const data = await this.prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        business: { select: { id: true, name: true, slug: true, publicPhone: true } },
        service: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, title: true } },
      },
      orderBy: { startsAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async manage(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:leads:manage");
    await this.planEntitlements.requireFeature(businessId, "bookingEnabled");
    const data = await this.prisma.booking.findMany({
      where: { businessId },
      include: {
        customer: {
          select: {
            email: true,
            phone: true,
            customerProfile: { select: { displayName: true } },
          },
        },
        service: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, title: true } },
      },
      orderBy: { startsAt: "desc" },
      take: 200,
    });
    return { data };
  }

  async setup(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:catalog:manage");
    await this.planEntitlements.requireFeature(businessId, "bookingEnabled");
    const [providers, schedules, timeOff, services] = await Promise.all([
      this.prisma.bookingProvider.findMany({
        where: { businessId, isActive: true },
        include: {
          services: { include: { service: { select: { id: true, name: true } } } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.bookingSchedule.findMany({
        where: { businessId, isActive: true },
        include: {
          provider: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
        orderBy: [{ weekday: "asc" }, { startsMinute: "asc" }],
      }),
      this.prisma.bookingTimeOff.findMany({
        where: { provider: { businessId }, endsAt: { gte: new Date() } },
        include: { provider: { select: { id: true, name: true } } },
        orderBy: { startsAt: "asc" },
        take: 100,
      }),
      this.prisma.service.findMany({
        where: { businessId, isActive: true, deletedAt: null },
        select: { id: true, name: true, durationMinutes: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { data: { providers, schedules, timeOff, services } };
  }

  async createProvider(userId: string, input: CreateBookingProviderDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    await this.planEntitlements.requireFeature(input.businessId, "bookingEnabled");
    const serviceIds = [...new Set(input.serviceIds)];
    const count = await this.prisma.service.count({
      where: { id: { in: serviceIds }, businessId: input.businessId, isActive: true, deletedAt: null },
    });
    if (count !== serviceIds.length) {
      throw new BadRequestException("Every assigned service must belong to this business.");
    }
    const data = await this.prisma.bookingProvider.create({
      data: {
        businessId: input.businessId,
        name: input.name,
        title: input.title,
        imageUrl: input.imageUrl,
        services: serviceIds.length
          ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
          : undefined,
      },
      include: {
        services: { include: { service: { select: { id: true, name: true } } } },
      },
    });
    return { data };
  }

  async createSchedule(userId: string, input: CreateBookingScheduleDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    await this.planEntitlements.requireFeature(input.businessId, "bookingEnabled");
    if (input.endsMinute <= input.startsMinute) {
      throw new BadRequestException("Schedule end time must be after its start time.");
    }
    const provider = await this.prisma.bookingProvider.findFirst({
      where: { id: input.providerId, businessId: input.businessId, isActive: true },
      include: { services: { select: { serviceId: true } } },
    });
    if (!provider) throw new NotFoundException("Booking provider not found.");
    if (input.serviceId && !provider.services.some((item) => item.serviceId === input.serviceId)) {
      throw new BadRequestException("The selected service is not assigned to this provider.");
    }
    const conflict = await this.prisma.bookingSchedule.findFirst({
      where: {
        providerId: input.providerId,
        weekday: input.weekday,
        isActive: true,
        startsMinute: { lt: input.endsMinute },
        endsMinute: { gt: input.startsMinute },
        OR: input.serviceId
          ? [{ serviceId: input.serviceId }, { serviceId: null }]
          : undefined,
      },
    });
    if (conflict) throw new ConflictException("This availability overlaps another active schedule.");
    const data = await this.prisma.bookingSchedule.create({ data: input });
    return { data };
  }

  async deleteSchedule(userId: string, id: string) {
    const schedule = await this.prisma.bookingSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException("Booking schedule not found.");
    await this.businessAccess.require(userId, schedule.businessId, "business:catalog:manage");
    const data = await this.prisma.bookingSchedule.update({
      where: { id },
      data: { isActive: false },
    });
    return { data };
  }

  async createTimeOff(userId: string, input: CreateBookingTimeOffDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    await this.planEntitlements.requireFeature(input.businessId, "bookingEnabled");
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("Time off must end after it starts.");
    const provider = await this.prisma.bookingProvider.findFirst({
      where: { id: input.providerId, businessId: input.businessId, isActive: true },
    });
    if (!provider) throw new NotFoundException("Booking provider not found.");
    const data = await this.prisma.bookingTimeOff.create({
      data: {
        providerId: input.providerId,
        startsAt,
        endsAt,
        reason: input.reason,
      },
    });
    return { data };
  }

  async availabilityProviders(businessId: string, serviceId: string) {
    const plan = await this.planEntitlements.activePlan(businessId);
    if (!plan?.bookingEnabled) return { data: [] };
    const data = await this.prisma.bookingProvider.findMany({
      where: {
        businessId,
        isActive: true,
        services: { some: { serviceId } },
        business: { status: "ACTIVE", deletedAt: null },
      },
      select: { id: true, name: true, title: true, imageUrl: true },
      orderBy: { name: "asc" },
    });
    return { data };
  }

  async availabilitySlots(
    businessId: string,
    serviceId: string,
    date: string,
    providerId?: string,
  ) {
    const plan = await this.planEntitlements.activePlan(businessId);
    if (!plan?.bookingEnabled) return { data: [] };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("Date must use YYYY-MM-DD.");
    }
    const dayStart = this.indiaDateAtMinute(date, 0);
    const dayEnd = this.indiaDateAtMinute(date, 1440);
    const now = new Date();
    if (dayEnd <= now) return { data: [] };
    if (dayStart > new Date(now.getTime() + 120 * 24 * 60 * 60_000)) {
      throw new BadRequestException("Appointments can be viewed up to 120 days ahead.");
    }
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId,
        isActive: true,
        deletedAt: null,
        business: { status: "ACTIVE", deletedAt: null },
      },
      select: { durationMinutes: true },
    });
    if (!service) throw new NotFoundException("Bookable service not found.");
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const schedules = await this.prisma.bookingSchedule.findMany({
      where: {
        businessId,
        weekday,
        isActive: true,
        ...(providerId ? { providerId } : {}),
        OR: [{ serviceId }, { serviceId: null }],
        provider: { isActive: true, services: { some: { serviceId } } },
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: dayEnd } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: dayStart } }] },
        ],
      },
      include: { provider: { select: { id: true, name: true, title: true } } },
      orderBy: [{ startsMinute: "asc" }, { provider: { name: "asc" } }],
    });
    const providerIds = [...new Set(schedules.map((schedule) => schedule.providerId))];
    const [bookings, timeOff] = providerIds.length
      ? await Promise.all([
          this.prisma.booking.findMany({
            where: {
              providerId: { in: providerIds },
              status: { in: ["REQUESTED", "CONFIRMED"] },
              startsAt: { gte: dayStart, lt: dayEnd },
            },
            select: { providerId: true, startsAt: true, durationMinutes: true },
          }),
          this.prisma.bookingTimeOff.findMany({
            where: {
              providerId: { in: providerIds },
              startsAt: { lt: dayEnd },
              endsAt: { gt: dayStart },
            },
            select: { providerId: true, startsAt: true, endsAt: true },
          }),
        ])
      : [[], []];
    const durationMinutes = service.durationMinutes ?? 30;
    const seen = new Set<string>();
    const data = schedules.flatMap((schedule) => {
      const result: Array<{
        startsAt: string;
        endsAt: string;
        durationMinutes: number;
        provider: { id: string; name: string; title: string | null };
      }> = [];
      for (
        let minute = schedule.startsMinute;
        minute + durationMinutes <= schedule.endsMinute;
        minute += schedule.slotIntervalMinutes
      ) {
        const startsAt = this.indiaDateAtMinute(date, minute);
        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
        const key = `${schedule.providerId}:${startsAt.toISOString()}`;
        if (seen.has(key) || startsAt <= now) continue;
        const unavailable = bookings.some((booking) =>
          booking.providerId === schedule.providerId
          && booking.startsAt < endsAt
          && new Date(booking.startsAt.getTime() + booking.durationMinutes * 60_000) > startsAt,
        ) || timeOff.some((period) =>
          period.providerId === schedule.providerId
          && period.startsAt < endsAt
          && period.endsAt > startsAt,
        );
        if (unavailable) continue;
        seen.add(key);
        result.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          durationMinutes,
          provider: schedule.provider,
        });
      }
      return result;
    });
    return { data };
  }

  async create(userId: string, input: CreateBookingDto) {
    await this.planEntitlements.requireFeature(input.businessId, "bookingEnabled");
    const startsAt = new Date(input.startsAt);
    if (startsAt <= new Date()) throw new BadRequestException("Choose an appointment time in the future.");
    const service = input.serviceId
      ? await this.prisma.service.findFirst({
          where: {
            id: input.serviceId,
            businessId: input.businessId,
            isActive: true,
            deletedAt: null,
            business: { status: "ACTIVE", deletedAt: null },
          },
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            business: { select: { name: true, owner: { select: { userId: true } } } },
          },
        })
      : null;
    if (input.serviceId && !service) throw new NotFoundException("Bookable service not found.");
    const business = service
      ? service.business
      : await this.prisma.business.findFirst({
          where: { id: input.businessId, status: "ACTIVE", deletedAt: null },
          select: { name: true, owner: { select: { userId: true } } },
        });
    if (!business) throw new NotFoundException("Business not found.");
    const provider = input.providerId
      ? await this.prisma.bookingProvider.findFirst({
          where: {
            id: input.providerId,
            businessId: input.businessId,
            isActive: true,
            ...(input.serviceId ? { services: { some: { serviceId: input.serviceId } } } : {}),
          },
          select: { id: true, name: true },
        })
      : null;
    if (input.providerId && !provider) throw new NotFoundException("Available provider not found.");
    const durationMinutes = input.durationMinutes ?? service?.durationMinutes ?? 30;
    await this.assertSlotAvailable({
      businessId: input.businessId,
      serviceId: input.serviceId,
      providerId: provider?.id,
      providerName: provider?.name ?? input.providerName,
      startsAt,
      durationMinutes,
    });
    const data = await this.prisma.$transaction(async (transaction) => {
      const booking = await transaction.booking.create({
        data: {
          businessId: input.businessId,
          serviceId: input.serviceId,
          providerId: provider?.id,
          customerId: userId,
          providerName: provider?.name ?? input.providerName,
          startsAt,
          durationMinutes,
          customerNote: input.customerNote,
        },
        include: {
          business: { select: { name: true } },
          service: { select: { name: true } },
          provider: { select: { name: true, title: true } },
        },
      });
      await transaction.notification.create({
        data: {
          userId: business.owner.userId,
          type: "NEW_ENQUIRY",
          channel: "IN_APP",
          title: "New booking request",
          body: `${booking.service?.name ?? "Appointment"} requested for ${startsAt.toLocaleString("en-IN")}`,
          data: { bookingId: booking.id, businessId: input.businessId },
          sentAt: new Date(),
        },
      });
      return booking;
    });
    await this.scheduleReminders(data.id, startsAt);
    return { data };
  }

  async reschedule(userId: string, id: string, input: RescheduleBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, owner: { select: { userId: true } } } },
        service: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found.");
    if (!["REQUESTED", "CONFIRMED"].includes(booking.status)) {
      throw new ConflictException("This booking cannot be rescheduled.");
    }
    const isCustomer = booking.customerId === userId;
    if (!isCustomer) {
      await this.businessAccess.require(userId, booking.businessId, "business:leads:manage");
    }
    const startsAt = new Date(input.startsAt);
    if (startsAt <= new Date()) throw new BadRequestException("Choose an appointment time in the future.");
    const providerId = input.providerId ?? booking.providerId ?? undefined;
    const provider = providerId
      ? await this.prisma.bookingProvider.findFirst({
          where: {
            id: providerId,
            businessId: booking.businessId,
            isActive: true,
            ...(booking.serviceId ? { services: { some: { serviceId: booking.serviceId } } } : {}),
          },
          select: { id: true, name: true },
        })
      : null;
    if (providerId && !provider) throw new NotFoundException("Available provider not found.");
    await this.assertSlotAvailable({
      businessId: booking.businessId,
      serviceId: booking.serviceId ?? undefined,
      providerId: provider?.id,
      providerName: provider?.name ?? booking.providerName ?? undefined,
      startsAt,
      durationMinutes: booking.durationMinutes,
      excludeBookingId: booking.id,
    });
    const now = new Date();
    const data = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.booking.update({
        where: { id },
        data: {
          startsAt,
          providerId: provider?.id,
          providerName: provider?.name ?? booking.providerName,
          status: isCustomer ? "REQUESTED" : booking.status,
          confirmedAt: isCustomer ? null : booking.confirmedAt,
          rescheduledAt: now,
          reminder24hSentAt: null,
          reminder2hSentAt: null,
        },
      });
      await transaction.notification.create({
        data: {
          userId: isCustomer ? booking.business.owner.userId : booking.customerId,
          type: "CUSTOMER_RESPONSE",
          channel: "IN_APP",
          title: "Booking rescheduled",
          body: `${booking.business.name}: ${booking.service?.name ?? "Appointment"} · ${startsAt.toLocaleString("en-IN")}`,
          data: { bookingId: id, startsAt: startsAt.toISOString(), requiresConfirmation: isCustomer },
          sentAt: now,
        },
      });
      return updated;
    });
    await this.scheduleReminders(id, startsAt);
    return { data };
  }

  async update(userId: string, id: string, input: UpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true } },
        service: { select: { name: true } },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found.");
    await this.businessAccess.require(userId, booking.businessId, "business:leads:manage");
    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status)) {
      throw new ConflictException("This booking is already final.");
    }
    const now = new Date();
    const data = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.booking.update({
        where: { id },
        data: {
          status: input.status,
          businessNote: input.businessNote,
          confirmedAt: input.status === "CONFIRMED" ? now : undefined,
          completedAt: input.status === "COMPLETED" ? now : undefined,
          cancelledAt: input.status === "CANCELLED" ? now : undefined,
        },
      });
      await transaction.notification.create({
        data: {
          userId: booking.customerId,
          type: "CUSTOMER_RESPONSE",
          channel: "IN_APP",
          title: `Booking ${input.status.toLowerCase()}`,
          body: `${booking.business.name}: ${booking.service?.name ?? "Appointment"}`,
          data: { bookingId: booking.id, status: input.status },
          sentAt: now,
        },
      });
      return updated;
    });
    return { data };
  }

  async cancel(userId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { business: { select: { owner: { select: { userId: true } }, name: true } } },
    });
    if (!booking) throw new NotFoundException("Booking not found.");
    if (booking.customerId !== userId) throw new ForbiddenException("You cannot cancel this booking.");
    if (!["REQUESTED", "CONFIRMED"].includes(booking.status)) {
      throw new ConflictException("This booking cannot be cancelled.");
    }
    const now = new Date();
    const data = await this.prisma.$transaction(async (transaction) => {
      const cancelled = await transaction.booking.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: now },
      });
      await transaction.notification.create({
        data: {
          userId: booking.business.owner.userId,
          type: "CUSTOMER_RESPONSE",
          channel: "IN_APP",
          title: "Customer cancelled a booking",
          body: `${booking.business.name}: ${booking.startsAt.toLocaleString("en-IN")}`,
          data: { bookingId: id, status: "CANCELLED" },
          sentAt: now,
        },
      });
      return cancelled;
    });
    return { data };
  }

  async deliverReminder(bookingId: string, kind: ReminderKind) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: { select: { name: true } },
        service: { select: { name: true } },
        provider: { select: { name: true } },
      },
    });
    if (!booking || !["REQUESTED", "CONFIRMED"].includes(booking.status)) {
      return { bookingId, kind, skipped: true };
    }
    const now = new Date();
    const threshold = new Date(booking.startsAt.getTime() - (kind === "24h" ? 24 : 2) * 60 * 60_000);
    const sent = kind === "24h" ? booking.reminder24hSentAt : booking.reminder2hSentAt;
    if (sent || booking.startsAt <= now || now < threshold) {
      return { bookingId, kind, skipped: true };
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.notification.create({
        data: {
          id: `booking-reminder-${booking.id}-${kind}-${booking.startsAt.getTime()}`,
          userId: booking.customerId,
          type: "BOOKING_REMINDER",
          channel: "IN_APP",
          title: `Appointment reminder · ${kind}`,
          body: `${booking.business.name}: ${booking.service?.name ?? "Appointment"} with ${booking.provider?.name ?? booking.providerName ?? "your provider"} at ${booking.startsAt.toLocaleString("en-IN")}`,
          data: { bookingId: booking.id, startsAt: booking.startsAt.toISOString(), kind },
          sentAt: now,
        },
      });
      await transaction.booking.update({
        where: { id: booking.id },
        data: kind === "24h" ? { reminder24hSentAt: now } : { reminder2hSentAt: now },
      });
    });
    return { bookingId, kind, skipped: false };
  }

  async deliverDueReminders() {
    const now = new Date();
    const data = await this.prisma.booking.findMany({
      where: {
        status: { in: ["REQUESTED", "CONFIRMED"] },
        startsAt: { gt: now, lte: new Date(now.getTime() + 24 * 60 * 60_000) },
        OR: [{ reminder24hSentAt: null }, { reminder2hSentAt: null }],
      },
      select: { id: true, startsAt: true, reminder24hSentAt: true, reminder2hSentAt: true },
      orderBy: { startsAt: "asc" },
      take: 1_000,
    });
    let sent = 0;
    for (const booking of data) {
      if (!booking.reminder24hSentAt) {
        const result = await this.deliverReminder(booking.id, "24h");
        if (!result.skipped) sent += 1;
      }
      if (
        !booking.reminder2hSentAt
        && booking.startsAt <= new Date(now.getTime() + 2 * 60 * 60_000)
      ) {
        const result = await this.deliverReminder(booking.id, "2h");
        if (!result.skipped) sent += 1;
      }
    }
    return { checked: data.length, sent };
  }

  private async assertSlotAvailable(input: {
    businessId: string;
    serviceId?: string;
    providerId?: string;
    providerName?: string;
    startsAt: Date;
    durationMinutes: number;
    excludeBookingId?: string;
  }) {
    const endsAt = new Date(input.startsAt.getTime() + input.durationMinutes * 60_000);
    if (input.providerId) {
      const weekday = new Date(input.startsAt.getTime() + 5.5 * 60 * 60_000).getUTCDay();
      const indiaDate = new Date(input.startsAt.getTime() + 5.5 * 60 * 60_000);
      const startsMinute = indiaDate.getUTCHours() * 60 + indiaDate.getUTCMinutes();
      const endsMinute = startsMinute + input.durationMinutes;
      const schedule = await this.prisma.bookingSchedule.findFirst({
        where: {
          businessId: input.businessId,
          providerId: input.providerId,
          weekday,
          isActive: true,
          startsMinute: { lte: startsMinute },
          endsMinute: { gte: endsMinute },
          OR: input.serviceId ? [{ serviceId: input.serviceId }, { serviceId: null }] : undefined,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: input.startsAt } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: input.startsAt } }] },
          ],
        },
      });
      if (!schedule) throw new ConflictException("That time is outside the provider's published schedule.");
      const timeOff = await this.prisma.bookingTimeOff.findFirst({
        where: {
          providerId: input.providerId,
          startsAt: { lt: endsAt },
          endsAt: { gt: input.startsAt },
        },
      });
      if (timeOff) throw new ConflictException("The provider is unavailable at that time.");
    }
    const nearby = await this.prisma.booking.findMany({
      where: {
        businessId: input.businessId,
        ...(input.providerId
          ? { providerId: input.providerId }
          : { providerName: input.providerName ?? null }),
        ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
        status: { in: ["REQUESTED", "CONFIRMED"] },
        startsAt: {
          gte: new Date(input.startsAt.getTime() - 12 * 60 * 60_000),
          lt: endsAt,
        },
      },
      select: { startsAt: true, durationMinutes: true },
    });
    const overlaps = nearby.some((booking) =>
      new Date(booking.startsAt).getTime() + booking.durationMinutes * 60_000
      > input.startsAt.getTime(),
    );
    if (overlaps) throw new ConflictException("That appointment time is already reserved.");
  }

  private indiaDateAtMinute(date: string, minute: number) {
    return new Date(new Date(`${date}T00:00:00+05:30`).getTime() + minute * 60_000);
  }

  private async scheduleReminders(bookingId: string, startsAt: Date) {
    if (!this.reminderQueue) return;
    for (const kind of ["24h", "2h"] as const) {
      const hours = kind === "24h" ? 24 : 2;
      await this.reminderQueue.add(
        "deliver-booking-reminder",
        { bookingId, kind },
        {
          jobId: `booking-reminder-${bookingId}-${kind}-${startsAt.getTime()}`,
          delay: Math.max(0, startsAt.getTime() - Date.now() - hours * 60 * 60_000),
          attempts: 5,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: 200,
          removeOnFail: 500,
        },
      );
    }
  }
}
