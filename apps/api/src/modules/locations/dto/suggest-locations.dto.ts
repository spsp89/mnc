import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SuggestLocationsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  q!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;
}
