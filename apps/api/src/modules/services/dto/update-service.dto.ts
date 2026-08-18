import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { MediaInputDto } from "../../../common/dto/media-input.dto";

export class UpdateServiceDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(180) slug?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(5000) description?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) startingPrice?: number | null;
  @IsOptional() @IsIn(["FIXED", "STARTING_AT", "HOURLY", "DAILY", "PER_UNIT", "QUOTE"]) pricingType?: "FIXED" | "STARTING_AT" | "HOURLY" | "DAILY" | "PER_UNIT" | "QUOTE";
  @IsOptional() @Type(() => Number) @IsInt() @Min(5) @Max(525600) durationMinutes?: number | null;
  @IsOptional() @IsBoolean() homeService?: boolean;
  @IsOptional() @IsObject() availability?: Record<string, unknown>;
  @IsOptional() @IsObject() serviceAreas?: Record<string, unknown>;
  @IsOptional() @IsObject() bookingQuestions?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => MediaInputDto)
  media?: MediaInputDto[];
}
