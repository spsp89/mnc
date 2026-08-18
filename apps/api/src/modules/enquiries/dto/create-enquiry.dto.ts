import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

class EnquiryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  details?: Record<string, unknown>;
}

export class CreateEnquiryDto {
  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(1000)
  requirement!: string;

  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(100)
  locality!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  urgency?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerName!: string;

  @ApiProperty()
  @IsString() @Matches(/^\+?[0-9][0-9\s-]{8,18}[0-9]$/)
  phone!: string;

  @ApiProperty({ enum: ["call", "whatsapp", "either", "in_app"] })
  @IsIn(["call", "whatsapp", "either", "in_app"])
  contactPreference!: string;

  @ApiProperty({ description: "Must be explicitly granted by the customer." })
  @IsBoolean()
  consent!: boolean;

  @ApiPropertyOptional({ type: [EnquiryItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EnquiryItemDto)
  items?: EnquiryItemDto[];
}
