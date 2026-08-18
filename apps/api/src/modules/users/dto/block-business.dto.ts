import { IsOptional, IsString, MaxLength } from "class-validator";

export class BlockBusinessDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
