import { IsIn, IsString } from "class-validator";

export class CreateSubscriptionDto {
  @IsString() businessId!: string;
  @IsString() planId!: string;
  @IsIn(["monthly", "annual"]) billingCycle!: "monthly" | "annual";
}
