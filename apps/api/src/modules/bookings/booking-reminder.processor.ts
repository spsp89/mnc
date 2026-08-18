import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import type { Job, Queue } from "bullmq";
import { BOOKING_REMINDER_QUEUE, BookingsService } from "./bookings.service";

type BookingReminderJob =
  | { bookingId: string; kind: "24h" | "2h" }
  | Record<string, never>;

@Injectable()
@Processor(BOOKING_REMINDER_QUEUE)
export class BookingReminderProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly bookings: BookingsService,
    @InjectQueue(BOOKING_REMINDER_QUEUE)
    private readonly queue: Queue<BookingReminderJob>,
  ) {
    super();
  }

  async onModuleInit() {
    if (process.env.DISABLE_BACKGROUND_JOBS === "true") return;
    await this.queue.upsertJobScheduler(
      "booking-reminder-sweep",
      { every: 5 * 60_000 },
      {
        name: "deliver-due-booking-reminders",
        data: {},
        opts: {
          attempts: 5,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      },
    );
  }

  async process(job: Job<BookingReminderJob>) {
    if (
      job.name === "deliver-booking-reminder"
      && "bookingId" in job.data
      && "kind" in job.data
    ) {
      return this.bookings.deliverReminder(job.data.bookingId, job.data.kind);
    }
    if (job.name === "deliver-due-booking-reminders") {
      return this.bookings.deliverDueReminders();
    }
    return { ignored: true };
  }
}
