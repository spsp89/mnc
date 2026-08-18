import { IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class AttachBusinessMediaDto {
  @IsIn(["logo", "banner", "gallery"])
  kind!: "logo" | "banner" | "gallery";

  @IsString()
  @Matches(/^quarantine\/business\/[a-zA-Z0-9/_-]+\.(jpg|png|webp)$/)
  objectKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;
}
