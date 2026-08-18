import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DeliveriesController, DeliveryWebhooksController } from "./deliveries.controller";
import { DeliveriesService } from "./deliveries.service";

@Module({
  imports: [AuthModule],
  controllers: [DeliveriesController, DeliveryWebhooksController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
