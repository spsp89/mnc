import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { MediaInputDto } from "../../../common/dto/media-input.dto";

export class CreateReviewDto {
  @IsString() businessId!: string;
  @IsOptional() @IsString() enquiryId?: string;
  @IsOptional() @IsString() orderId?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) overallRating!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) serviceQuality?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) valueForMoney?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) responseTime?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) staffBehaviour?: number;
  @IsString() @MinLength(20) @MaxLength(3000) body!: string;
  @IsOptional() @IsBoolean() recommended?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MediaInputDto) media?: MediaInputDto[];
}
