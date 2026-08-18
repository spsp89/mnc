import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

const optionalLimit = () => Transform(({ value }) => value === "" || value === undefined ? undefined : value);

export class AdminPlanDto {
  @IsString() @Length(2, 60) name!: string;
  @IsString() @Length(2, 70) slug!: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(10_000) priority!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(10_000) displayOrder!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(10) starLevel!: number;
  @IsIn(["NEARBY_5KM", "CONSTITUENCY", "DISTRICT", "STATE"]) listingReach!: "NEARBY_5KM" | "CONSTITUENCY" | "DISTRICT" | "STATE";
  @IsIn(["NEARBY_5KM", "DISTRICT", "STATE"]) offerReach!: "NEARBY_5KM" | "DISTRICT" | "STATE";
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) monthlyPrice!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) annualPrice!: number;
  @optionalLimit() @IsOptional() @Type(() => Number) @IsInt() @Min(0) leadQuota?: number;
  @optionalLimit() @IsOptional() @Type(() => Number) @IsInt() @Min(0) offerLimit?: number;
  @optionalLimit() @IsOptional() @Type(() => Number) @IsInt() @Min(0) productLimit?: number;
  @optionalLimit() @IsOptional() @Type(() => Number) @IsInt() @Min(0) mediaLimit?: number;
  @Type(() => Number) @IsInt() @Min(1) categoryLimit!: number;
  @Type(() => Number) @IsInt() @Min(1) locationLimit!: number;
  @Type(() => Number) @IsInt() @Min(1) teamMemberLimit!: number;
  @IsBoolean() descriptionEnabled!: boolean;
  @IsBoolean() socialLinksEnabled!: boolean;
  @IsBoolean() bookingEnabled!: boolean;
  @IsBoolean() deliveryEnabled!: boolean;
  @IsBoolean() automaticLeadAlerts!: boolean;
  @IsBoolean() sponsoredPlacement!: boolean;
  @IsBoolean() advancedAnalytics!: boolean;
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) features!: string[];
  @IsBoolean() isActive!: boolean;
  @IsString() @Length(5, 500) reason!: string;
}

export class ReorderPlansDto {
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) ids!: string[];
  @IsString() @Length(5, 500) reason!: string;
}

export class AdminSubscriptionQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsIn(["PENDING_PAYMENT", "TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "PAUSED", "CANCELLED", "EXPIRED"]) status?: string;
  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsIn(["pending", "paid", "failed", "refunded", "cancelled"]) paymentStatus?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class AssignSubscriptionDto {
  @IsString() businessId!: string;
  @IsString() planId!: string;
  @IsIn(["monthly", "annual"]) billingCycle!: "monthly" | "annual";
  @Type(() => Number) @IsInt() @Min(1) @Max(730) durationDays!: number;
  @IsString() @Length(5, 500) reason!: string;
}

export class AdminSubscriptionActionDto {
  @IsIn(["CHANGE_PLAN", "EXTEND", "CANCEL", "REACTIVATE"])
  action!: "CHANGE_PLAN" | "EXTEND" | "CANCEL" | "REACTIVATE";

  @ValidateIf((input: AdminSubscriptionActionDto) => input.action === "CHANGE_PLAN")
  @IsString()
  planId?: string;

  @ValidateIf((input: AdminSubscriptionActionDto) => input.action === "EXTEND")
  @Type(() => Number) @IsInt() @Min(1) @Max(730)
  extendDays?: number;

  @IsString() @Length(5, 500) reason!: string;
}
