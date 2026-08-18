import { Type } from "class-transformer";
import { Equals, IsBoolean, IsIn, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class AdminPaymentQueryDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsIn(["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"]) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class AdminPaymentActionDto {
  @IsIn(["MARK_FAILED", "CANCEL"]) action!: "MARK_FAILED" | "CANCEL";
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}

export class CreateManualPaymentDto {
  @IsString() @MinLength(1) @MaxLength(100) subscriptionId!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(999999999.99) amount!: number;
  @IsIn(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"])
  method!: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE" | "OTHER";
  @IsString() @MinLength(3) @MaxLength(120) reference!: string;
  @IsISO8601({ strict: true }) receivedAt!: string;
  @IsString() @MinLength(8) @MaxLength(1000) evidence!: string;
  @IsBoolean() @Equals(true) confirmedReceived!: boolean;
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}

export class AdminRefundQueryDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsIn(["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"]) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class CreateManualRefundDto {
  @IsString() @MinLength(1) @MaxLength(100) paymentId!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(999999999.99) amount!: number;
  @IsIn(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"])
  method!: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE" | "OTHER";
  @IsString() @MinLength(3) @MaxLength(120) reference!: string;
  @IsISO8601({ strict: true }) completedAt!: string;
  @IsString() @MinLength(8) @MaxLength(1000) evidence!: string;
  @IsBoolean() @Equals(true) confirmedReturned!: boolean;
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
  @IsString() @MinLength(8) @MaxLength(1000) auditReason!: string;
}

export class CreateAutomaticRefundDto {
  @IsString() @MinLength(1) @MaxLength(100) paymentId!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(999999999.99) amount!: number;
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
  @IsString() @MinLength(8) @MaxLength(1000) auditReason!: string;
}
