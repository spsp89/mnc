import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateBookingDto {
  @IsString() businessId!: string;
  @IsOptional() @IsString() serviceId?: string;
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsString() @MaxLength(120) providerName?: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(480) durationMinutes?: number;
  @IsOptional() @IsString() @MaxLength(2000) customerNote?: string;
}
