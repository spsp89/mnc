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
import {
  mediaUploadPurposes,
  type MediaUploadPurpose,
} from "./create-media-upload.dto";

export class CompleteMediaUploadDto {
  @IsIn(mediaUploadPurposes)
  purpose!: MediaUploadPurpose;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,100}$/)
  businessId?: string;

  @IsString()
  @Matches(/^(private\/(verification|delivery)|quarantine\/(business|product|service|review|banner|advertisement))\/[a-zA-Z0-9/_-]+\.(jpg|png|webp|pdf)$/)
  objectKey!: string;

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
