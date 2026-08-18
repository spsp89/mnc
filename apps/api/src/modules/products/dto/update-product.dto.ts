import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { MediaInputDto } from "../../../common/dto/media-input.dto";

export class UpdateProductDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(180) slug?: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string | null;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(5000) description?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountPrice?: number | null;
  @IsOptional() @IsIn(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "MADE_TO_ORDER"]) stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "MADE_TO_ORDER";
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) minimumOrderQty?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(4) @IsIn(["pickup", "local_delivery", "home_delivery", "courier"], { each: true }) deliveryOptions?: string[];
  @IsOptional() @IsObject() specifications?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(500) warranty?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) returnInformation?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => MediaInputDto)
  media?: MediaInputDto[];
}
