import { Type } from "class-transformer";
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export const advertisementPlacements = ["HOME_HERO", "HOME_SECONDARY", "LISTINGS", "SEARCH_RESULTS", "OFFERS", "BUSINESS_DETAIL"] as const;
export const advertisementAudiences = ["ALL", "STATE", "DISTRICT", "CITY"] as const;

export class CreateAdminAdvertisementDto {
  @IsOptional() @IsString() @MaxLength(100) businessId?: string;
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsIn(advertisementPlacements) placement!: (typeof advertisementPlacements)[number];
  @IsIn(advertisementAudiences) audience!: (typeof advertisementAudiences)[number];
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(600) creativeKey?: string;
  @IsString() @MaxLength(500)
  @Matches(/^(https:\/\/[^\s]+|\/[a-zA-Z0-9/_?&=.#%-]*)$/, { message: "Destination must be HTTPS or an internal path." })
  destination!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(999999999.99) budget!: number;
  @IsIn(["DRAFT", "SCHEDULED"]) status!: "DRAFT" | "SCHEDULED";
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}
