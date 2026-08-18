import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class MediaInputDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9/_.-]{2,500}$/)
  objectKey!: string;

  @IsIn(["image", "video"])
  mediaType!: "image" | "video";

  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sortOrder?: number;

  @IsOptional()
  @IsIn(["gallery", "thumbnail"])
  variant?: "gallery" | "thumbnail";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  height?: number;
}
