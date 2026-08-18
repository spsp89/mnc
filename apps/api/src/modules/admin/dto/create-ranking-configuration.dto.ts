import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsObject, IsString, MaxLength, MinLength } from "class-validator";

export class CreateRankingConfigurationDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string;

  @ApiProperty({
    example: {
      relevance: 0.32,
      distance: 0.24,
      reputation: 0.18,
      completeness: 0.14,
      responsiveness: 0.12,
    },
  })
  @IsObject()
  weights!: Record<string, number>;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  activate!: boolean;
}
