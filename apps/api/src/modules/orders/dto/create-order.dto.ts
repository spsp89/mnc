import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
  @IsString() productId!: string;
  @IsOptional() @IsString() variantId?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000) quantity!: number;
}

export class CreateOrderDto {
  @IsString() businessId!: string;
  @IsIn(["pickup", "delivery"]) fulfilmentType!: "pickup" | "delivery";
  @IsOptional() @IsObject() deliveryAddress?: Record<string, string>;
  @IsOptional() @IsString() @MaxLength(80) couponCode?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
