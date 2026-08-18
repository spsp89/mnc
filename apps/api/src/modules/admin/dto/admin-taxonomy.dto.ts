import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class AdminCategoryDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(140) slug!: string;
  @IsOptional() @IsString() @MaxLength(120) nameMalayalam?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) description?: string | null;
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAdminCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(140) slug?: string;
  @IsOptional() @IsString() @MaxLength(120) nameMalayalam?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) description?: string | null;
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class ReorderItemDto { @IsString() id!: string; @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder!: number; }
export class ReorderTaxonomyDto { @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => ReorderItemDto) items!: ReorderItemDto[]; }

export class AdminLocationDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(140) slug!: string;
  @IsIn(["COUNTRY", "STATE", "DISTRICT", "CITY", "CONSTITUENCY", "LOCALITY"]) type!: "COUNTRY" | "STATE" | "DISTRICT" | "CITY" | "CONSTITUENCY" | "LOCALITY";
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsLatitude() latitude?: number | null;
  @IsOptional() @Type(() => Number) @IsLongitude() longitude?: number | null;
}

export class UpdateAdminLocationDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(140) slug?: string;
  @IsOptional() @IsIn(["COUNTRY", "STATE", "DISTRICT", "CITY", "CONSTITUENCY", "LOCALITY"]) type?: "COUNTRY" | "STATE" | "DISTRICT" | "CITY" | "CONSTITUENCY" | "LOCALITY";
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsLatitude() latitude?: number | null;
  @IsOptional() @Type(() => Number) @IsLongitude() longitude?: number | null;
}

export class AdminListingActionDto {
  @IsIn(["DISABLE", "REACTIVATE"]) action!: "DISABLE" | "REACTIVATE";
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}
