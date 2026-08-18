import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export const bannerPlacements = ["HOME_HERO", "HOME_SECONDARY", "LISTINGS", "OFFERS", "MERCHANT_PORTAL"] as const;

export class AdminBannerDto {
  @IsString() @MinLength(2) @MaxLength(120) title!: string;
  @IsOptional() @IsString() @MaxLength(240) subtitle?: string;
  @IsOptional() @IsString() @MaxLength(40) ctaText?: string;
  @IsOptional() @IsString() @MaxLength(500)
  @Matches(/^(https:\/\/[^\s]+|\/[a-zA-Z0-9/_?&=.#%-]*)$/, { message: "CTA URL must be HTTPS or an internal path." })
  ctaUrl?: string;
  @IsIn(bannerPlacements) placement!: (typeof bannerPlacements)[number];
  @IsString() @MinLength(10) @MaxLength(600) imageKey!: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) displayOrder!: number;
  @IsBoolean() isActive!: boolean;
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}
