import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class UpdateReviewDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) overallRating?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) serviceQuality?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) valueForMoney?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) responseTime?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) staffBehaviour?: number;
  @IsOptional() @IsString() @MinLength(20) @MaxLength(3000) body?: string;
  @IsOptional() @IsBoolean() recommended?: boolean;
}
