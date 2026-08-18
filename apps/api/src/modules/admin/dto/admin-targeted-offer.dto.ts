import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateTargetedOfferDto {
  @IsString() @MinLength(1) @MaxLength(100) customerId!: string;
  @IsString() @MinLength(1) @MaxLength(100) businessId!: string;
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsString() @MinLength(10) @MaxLength(3000) description!: string;
  @IsIn(["PERCENTAGE", "FLAT", "FESTIVAL", "LIMITED_TIME", "COUPON", "COMBO", "NEW_CUSTOMER"])
  type!: "PERCENTAGE" | "FLAT" | "FESTIVAL" | "LIMITED_TIME" | "COUPON" | "COMBO" | "NEW_CUSTOMER";
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountValue?: number;
  @IsString() @MinLength(3) @MaxLength(40) couponCode!: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) minimumSpend?: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) maxRedemptions?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) productIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) serviceIds?: string[];
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}
