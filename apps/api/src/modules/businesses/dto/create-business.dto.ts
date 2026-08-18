import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsLatitude, IsLongitude, IsObject, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

class BusinessLocationDto {
  @IsString() @MinLength(3) @MaxLength(180) addressLine1!: string;
  @IsOptional() @IsString() @MaxLength(180) addressLine2?: string;
  @IsString() @MinLength(2) @MaxLength(100) locality!: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(120) constituency?: string;
  @IsString() @MinLength(2) @MaxLength(80) district!: string;
  @IsString() @MinLength(2) @MaxLength(80) state!: string;
  @IsString() @Matches(/^\d{6}$/) postalCode!: string;
  @Type(() => Number) @IsLatitude() latitude!: number;
  @Type(() => Number) @IsLongitude() longitude!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) serviceRadiusKm?: number;
}

class WorkingHourDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) opensAt?: string;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) closesAt?: string;
  @IsOptional() @IsBoolean() closed?: boolean;
}

export class CreateBusinessDto {
  @IsIn(["bronze", "silver", "gold", "platinum", "diamond", "ruby"])
  planSlug: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "ruby" = "bronze";
  @IsIn(["monthly", "annual"])
  billingCycle: "monthly" | "annual" = "monthly";
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(180) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) ownerLegalName!: string;
  @IsOptional() @IsString() @MaxLength(180) legalName?: string;
  @IsOptional() @IsString() @MinLength(30) @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(240) shortDescription?: string;
  @IsString() @Matches(/^\+?[1-9]\d{9,14}$/) phone!: string;
  @IsOptional() @IsBoolean() displayPhonePublicly?: boolean;
  @IsOptional() @IsString() @Matches(/^\+?[1-9]\d{9,14}$/) whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) websiteUrl?: string;
  @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) permanentDiscountPercent?: number;
  @IsOptional() @IsString() @MaxLength(120) permanentDiscountLabel?: string;
  @IsString() categoryId!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(200) yearsInBusiness?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(4) priceRange?: number;
  @ValidateNested() @Type(() => BusinessLocationDto) location!: BusinessLocationDto;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => WorkingHourDto)
  workingHours?: WorkingHourDto[];
}
