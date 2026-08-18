import { Type } from "class-transformer";
import { IsEmail, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateReferralDto {
  @IsString() businessId!: string;
  @IsString() @MinLength(2) @MaxLength(120) contactName!: string;
  @IsOptional() @IsString() @MaxLength(160) referredBusiness?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(3000) notes?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) estimatedValue?: number;
}
