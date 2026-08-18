import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateBookingProviderDto {
  @IsString() businessId!: string;
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) serviceIds!: string[];
}

export class CreateBookingScheduleDto {
  @IsString() businessId!: string;
  @IsString() providerId!: string;
  @IsOptional() @IsString() serviceId?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(6) weekday!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(1439) startsMinute!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(1440) endsMinute!: number;
  @Type(() => Number) @IsInt() @Min(10) @Max(240) slotIntervalMinutes!: number;
}

export class CreateBookingTimeOffDto {
  @IsString() businessId!: string;
  @IsString() providerId!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class RescheduleBookingDto {
  @IsDateString() startsAt!: string;
  @IsOptional() @IsString() providerId?: string;
}
