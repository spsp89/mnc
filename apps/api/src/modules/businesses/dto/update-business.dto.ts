import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsInt, IsLatitude, IsLongitude, IsObject, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class UpdateBusinessLocationDto {
  @IsString() @MinLength(3) @MaxLength(180) addressLine1!: string;
  @IsOptional() @IsString() @MaxLength(180) addressLine2?: string | null;
  @IsString() @MinLength(2) @MaxLength(100) locality!: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(120) constituency?: string | null;
  @IsString() @MinLength(2) @MaxLength(80) district!: string;
  @IsString() @MinLength(2) @MaxLength(80) state!: string;
  @IsString() @Matches(/^\d{6}$/) postalCode!: string;
  @Type(() => Number) @IsLatitude() latitude!: number;
  @Type(() => Number) @IsLongitude() longitude!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) serviceRadiusKm?: number;
  @IsOptional() @IsString() managedLocationId?: string | null;
}

export class UpdateWorkingHourDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) opensAt?: string | null;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) closesAt?: string | null;
  @IsOptional() @IsBoolean() closed?: boolean;
}

export class UpdateBusinessDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(180) slug?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) ownerContactName?: string;
  @IsOptional() @IsString() @Matches(/^\+?[1-9]\d{9,14}$/) contactPhone?: string;
  @IsOptional() @IsString() @Matches(/^\+?[1-9]\d{9,14}$/) contactWhatsapp?: string | null;
  @IsOptional() @IsString() @MinLength(30) @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(240) shortDescription?: string | null;
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) coverImageUrl?: string;
  @IsOptional() @IsString() @MaxLength(16) publicPhone?: string | null;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsUrl({ require_protocol: true }) websiteUrl?: string | null;
  @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @IsOptional() @IsString() @MaxLength(120) @Matches(/^[\w.-]{2,}@[\w.-]{2,}$/) upiId?: string | null;
  @IsOptional() @IsString() @MaxLength(160) paymentAccountName?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) permanentDiscountPercent?: number;
  @IsOptional() @IsString() @MaxLength(120) permanentDiscountLabel?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(200) yearsInBusiness?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(4) priceRange?: number | null;
  @IsOptional() @IsBoolean() acceptNewEnquiries?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(70) seoTitle?: string | null;
  @IsOptional() @IsString() @MaxLength(160) seoDescription?: string | null;
  @IsOptional() @ValidateNested() @Type(() => UpdateBusinessLocationDto) location?: UpdateBusinessLocationDto;
  @IsOptional() @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => UpdateWorkingHourDto) workingHours?: UpdateWorkingHourDto[];
}
