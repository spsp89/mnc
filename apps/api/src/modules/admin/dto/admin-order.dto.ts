import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class CreateManualOrderItemDto {
  @IsString() @MinLength(1) @MaxLength(100) productId!: string;
  @IsOptional() @IsString() @MaxLength(100) variantId?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000) quantity!: number;
}

export class CreateManualOrderDto {
  @IsString() @MinLength(1) @MaxLength(100) customerId!: string;
  @IsString() @MinLength(1) @MaxLength(100) businessId!: string;
  @IsString() @MinLength(3) @MaxLength(120) externalReference!: string;
  @IsIn(["pickup", "delivery"]) fulfilmentType!: "pickup" | "delivery";
  @IsOptional() @IsObject() deliveryAddress?: Record<string, string>;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(999999999.99) discount?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(999999999.99) tax?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(999999999.99) deliveryFee?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => CreateManualOrderItemDto)
  items!: CreateManualOrderItemDto[];
  @IsString() @MinLength(8) @MaxLength(1000) reason!: string;
}
