import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class RecordSearchHistoryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  query!: string;

  @IsOptional()
  @IsIn(["en", "ml"])
  language?: "en" | "ml";

  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  resultCount!: number;
}
