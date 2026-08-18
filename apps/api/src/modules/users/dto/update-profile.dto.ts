import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsIn(["en", "ml"])
  preferredLanguage?: "en" | "ml";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultState?: string;
}
