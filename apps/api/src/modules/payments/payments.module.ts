import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { PaymentsController } from "./payments.controller";
import { PaymentWebhookProcessor } from "./payment-webhook.processor";
import { PAYMENT_WEBHOOK_QUEUE, PaymentWebhookService } from "./payment-webhook.service";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: PAYMENT_WEBHOOK_QUEUE })],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentWebhookService, PaymentWebhookProcessor],
  exports: [PaymentsService],
})
export class PaymentsModule {}
