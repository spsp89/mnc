import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BookingReminderProcessor } from "./booking-reminder.processor";
import { BookingAvailabilityController, BookingsController } from "./bookings.controller";
import { BOOKING_REMINDER_QUEUE, BookingsService } from "./bookings.service";

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: BOOKING_REMINDER_QUEUE })],
  controllers: [BookingAvailabilityController, BookingsController],
  providers: [BookingsService, BookingReminderProcessor],
})
export class BookingsModule {}
