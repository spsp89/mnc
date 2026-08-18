import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const booleanValue = ({ value }: { value: unknown }) =>
  value === true || value === "true";

export class SearchBusinessesDto {
  @ApiPropertyOptional({ description: "Business, category, product, service or keyword" })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ enum: [1, 3, 5, 10, 25, 50], default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 3, 5, 10, 25, 50])
  radiusKm = 5;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  constituency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  openNow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  premium?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  offers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  homeService?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  delivery?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  fastResponse?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  priceRange?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  payment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  language?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  minYears?: number;

  @ApiPropertyOptional({
    enum: [
      "recommended",
      "nearest",
      "rating",
      "reviews",
      "recent",
      "price-low",
      "price-high",
    ],
  })
  @IsOptional()
  @IsIn([
    "recommended",
    "nearest",
    "rating",
    "reviews",
    "recent",
    "price-low",
    "price-high",
  ])
  sort = "recommended";

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  pageSize = 20;
}
