import { Type } from "class-transformer";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdateDeliveryDispatchDto {
  @IsIn(["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"])
  status!: "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

  @IsOptional() @IsString() @MaxLength(120) driverName?: string;
  @IsOptional() @IsString() @MaxLength(30) driverPhone?: string;
  @IsOptional() @IsString() @MaxLength(40) vehicleNumber?: string;
}

export class CaptureDeliveryProofDto {
  @IsString()
  @Matches(/^private\/delivery\/[a-zA-Z0-9/_-]+\.(jpg|png|webp)$/)
  objectKey!: string;

  @IsString() @MinLength(2) @MaxLength(120) receiverName!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude?: number;
}

export class SettleDeliveryDto {
  @Type(() => Number) @IsNumber() @Min(0) @Max(10_000_000) providerFee!: number;
  @IsString() @MinLength(2) @MaxLength(120) reference!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
