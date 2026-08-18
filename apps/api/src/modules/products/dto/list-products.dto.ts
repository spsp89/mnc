import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListProductsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  constituency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 3, 5, 10, 25, 50])
  radiusKm = 5;

  @IsOptional()
  @IsIn(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "MADE_TO_ORDER"])
  stock?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "MADE_TO_ORDER";

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  courier?: boolean;

  @IsOptional()
  @IsIn(["recommended", "best-selling", "nearest", "newest", "price-low", "price-high", "name", "category", "location", "status"])
  sort: "recommended" | "best-selling" | "nearest" | "newest" | "price-low" | "price-high" | "name" | "category" | "location" | "status" = "recommended";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;
}
