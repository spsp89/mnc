import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FirebasePushService } from "./firebase-push.service";
import { NotificationsController, WhatsAppWebhooksController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PUSH_DISPATCH_QUEUE, PushDispatchProcessor } from "./push-dispatch.processor";
import { WHATSAPP_DISPATCH_QUEUE, WhatsAppDispatchProcessor } from "./whatsapp-dispatch.processor";
import { WhatsAppProviderService } from "./whatsapp-provider.service";
import { WhatsAppWebhookService } from "./whatsapp-webhook.service";

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: PUSH_DISPATCH_QUEUE }, { name: WHATSAPP_DISPATCH_QUEUE })],
  controllers: [NotificationsController, WhatsAppWebhooksController],
  providers: [NotificationsService, FirebasePushService, PushDispatchProcessor, WhatsAppProviderService, WhatsAppDispatchProcessor, WhatsAppWebhookService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
