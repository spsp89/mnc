import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateSearchIntentDto {
  @IsString() @MinLength(2) @MaxLength(160)
  query!: string;

  @IsOptional() @IsString() @MaxLength(120)
  location?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90)
  latitude?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  longitude?: number;

  @IsOptional() @Type(() => Number) @IsIn([1, 3, 5, 10, 25, 50])
  radiusKm = 5;

  @IsOptional() @IsIn(["businesses", "products", "services"])
  source?: "businesses" | "products" | "services";
}
