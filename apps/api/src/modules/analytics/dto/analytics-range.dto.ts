import { IsDateString, IsOptional, IsString } from "class-validator";

export class AnalyticsRangeDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class BusinessAnalyticsQueryDto extends AnalyticsRangeDto {
  @IsString() businessId!: string;
}
