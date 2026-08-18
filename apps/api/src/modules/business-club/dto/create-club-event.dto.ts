import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateClubEventDto {
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsString() @MinLength(10) @MaxLength(2000) description!: string;
  @IsString() @MinLength(3) @MaxLength(240) venue!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(2) @Max(10_000) capacity?: number;
}
