import { IsIn, IsOptional, IsString, Matches } from "class-validator";
import {
  mediaUploadPurposes,
  type MediaUploadPurpose,
} from "./create-media-upload.dto";

export class CreateMediaDownloadDto {
  @IsIn(mediaUploadPurposes)
  purpose!: MediaUploadPurpose;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,100}$/)
  businessId?: string;

  @IsString()
  @Matches(/^(private\/(verification|delivery)|quarantine\/(business|product|service|review))\/[a-zA-Z0-9/_-]+\.(jpg|png|webp|pdf)$/)
  objectKey!: string;

  @IsOptional()
  @IsIn(["inline", "attachment"])
  disposition?: "inline" | "attachment";
}
