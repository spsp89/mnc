import { IsBoolean, IsIn, IsOptional } from "class-validator";

const notificationTypes = [
  "NEW_LEAD",
  "NEW_ENQUIRY",
  "NEARBY_OFFER",
  "WEEKLY_DRAW",
  "CUSTOMER_RESPONSE",
  "REVIEW_RECEIVED",
  "REVIEW_REPLY",
  "ORDER_UPDATE",
  "SUBSCRIPTION_RENEWAL",
  "PAYMENT_CONFIRMATION",
  "OFFER_EXPIRY",
  "VERIFICATION_UPDATE",
  "SUPPORT_UPDATE",
  "BOOKING_REMINDER",
] as const;

export class NotificationPreferenceDto {
  @IsIn(notificationTypes)
  type!: (typeof notificationTypes)[number];

  @IsOptional() @IsBoolean() inApp?: boolean;
  @IsOptional() @IsBoolean() push?: boolean;
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() sms?: boolean;
  @IsOptional() @IsBoolean() whatsapp?: boolean;
}
