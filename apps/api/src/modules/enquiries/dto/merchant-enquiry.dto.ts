import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class MerchantEnquiryQueryDto {
  @IsString() businessId!: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsIn(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED", "SPAM"]) status?: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "CLOSED" | "SPAM";
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class UpdateMerchantEnquiryStatusDto {
  @IsString() businessId!: string;
  @IsIn(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED", "SPAM"])
  status!: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "CLOSED" | "SPAM";
}
