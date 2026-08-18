import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateOfferDto {
  @IsString() businessId!: string;
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsString() @MinLength(10) @MaxLength(3000) description!: string;
  @IsIn(["PERCENTAGE", "FLAT", "FESTIVAL", "LIMITED_TIME", "COUPON", "COMBO", "NEW_CUSTOMER"])
  type!: "PERCENTAGE" | "FLAT" | "FESTIVAL" | "LIMITED_TIME" | "COUPON" | "COMBO" | "NEW_CUSTOMER";
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountValue?: number;
  @IsOptional() @IsString() @MaxLength(40) couponCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) minimumSpend?: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) maxRedemptions?: number;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) productIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) serviceIds?: string[];
}
