import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OfferNotificationProcessor } from "./offer-notification.processor";
import { OffersController } from "./offers.controller";
import { OFFER_NOTIFICATION_QUEUE, OffersService } from "./offers.service";
import { PlanEntitlementsModule } from "../../common/subscriptions/plan-entitlements.module";

@Module({
  imports: [AuthModule, PlanEntitlementsModule, BullModule.registerQueue({ name: OFFER_NOTIFICATION_QUEUE })],
  controllers: [OffersController],
  providers: [OffersService, OfferNotificationProcessor],
})
export class OffersModule {}
