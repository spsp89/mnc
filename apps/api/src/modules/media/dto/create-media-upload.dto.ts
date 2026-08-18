import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const mediaUploadPurposes = [
  "business_image",
  "product_image",
  "service_image",
  "review_image",
  "verification_document",
  "delivery_proof",
  "banner_image",
  "advertisement_image",
] as const;

export type MediaUploadPurpose = (typeof mediaUploadPurposes)[number];

export class CreateMediaUploadDto {
  @IsIn(mediaUploadPurposes)
  purpose!: MediaUploadPurpose;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,100}$/)
  businessId?: string;

  @IsString()
  @MaxLength(180)
  fileName!: string;

  @IsString()
  @MaxLength(100)
  contentType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25_000_000)
  sizeBytes!: number;

  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  sha256!: string;
}
