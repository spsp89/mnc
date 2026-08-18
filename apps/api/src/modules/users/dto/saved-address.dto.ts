import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class SavedAddressDto {
  @IsString() @MinLength(2) @MaxLength(40) label!: string;
  @IsString() @MinLength(2) @MaxLength(100) recipient!: string;
  @IsOptional() @IsString() @Matches(/^[+0-9 ()-]{7,20}$/) phone?: string;
  @IsString() @MinLength(3) @MaxLength(180) addressLine1!: string;
  @IsOptional() @IsString() @MaxLength(180) addressLine2?: string;
  @IsString() @MinLength(2) @MaxLength(100) locality!: string;
  @IsString() @MinLength(2) @MaxLength(100) city!: string;
  @IsOptional() @IsString() @MaxLength(100) district?: string;
  @IsString() @MinLength(2) @MaxLength(100) state!: string;
  @IsString() @Matches(/^[1-9][0-9]{5}$/) postalCode!: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
