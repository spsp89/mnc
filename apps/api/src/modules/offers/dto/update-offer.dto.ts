import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class UpdateOfferDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(3000) description?: string;
  @IsOptional() @IsIn(["PERCENTAGE", "FLAT", "FESTIVAL", "LIMITED_TIME", "COUPON", "COMBO", "NEW_CUSTOMER"]) type?: "PERCENTAGE" | "FLAT" | "FESTIVAL" | "LIMITED_TIME" | "COUPON" | "COMBO" | "NEW_CUSTOMER";
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountValue?: number | null;
  @IsOptional() @IsString() @MaxLength(40) couponCode?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) minimumSpend?: number | null;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) maxRedemptions?: number | null;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) productIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) serviceIds?: string[];
}
