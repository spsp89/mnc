import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateJobDto {
  @IsString() businessId!: string;
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(180) slug!: string;
  @IsString() @MinLength(30) @MaxLength(8000) description!: string;
  @IsIn(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"])
  employmentType!: string;
  @IsOptional() @IsIn(["ON_SITE", "HYBRID", "REMOTE"]) workplaceType?: string;
  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) skills!: string[];
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) salaryMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) salaryMax?: number;
  @IsString() @MaxLength(80) city!: string;
  @IsString() @MaxLength(80) district!: string;
  @IsString() @MaxLength(80) state!: string;
  @IsOptional() @IsUrl({ require_protocol: true }) applicationUrl?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsDateString() closesAt?: string;
}
