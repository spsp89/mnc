import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Job, Queue } from "bullmq";
import { OFFER_NOTIFICATION_QUEUE, OffersService } from "./offers.service";

type OfferNotificationJob =
  | { offerId: string }
  | Record<string, never>;

@Injectable()
@Processor(OFFER_NOTIFICATION_QUEUE)
export class OfferNotificationProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly offers: OffersService,
    @InjectQueue(OFFER_NOTIFICATION_QUEUE)
    private readonly queue: Queue<OfferNotificationJob>,
  ) {
    super();
  }

  async onModuleInit() {
    if (process.env.DISABLE_BACKGROUND_JOBS === "true") return;
    await this.queue.upsertJobScheduler(
      "offer-notification-sweep",
      { every: 60_000 },
      {
        name: "deliver-due-offers",
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

  async process(job: Job<OfferNotificationJob>) {
    if (job.name === "deliver-offer-notification" && "offerId" in job.data) {
      return this.offers.deliverScheduled(job.data.offerId);
    }
    if (job.name === "deliver-due-offers") {
      return this.offers.deliverDue();
    }
    return { ignored: true };
  }
}
