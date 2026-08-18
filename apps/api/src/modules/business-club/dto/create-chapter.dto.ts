import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateChapterDto {
  @IsString() @MinLength(3) @MaxLength(140) name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(160) slug!: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
  @IsString() @MinLength(2) @MaxLength(80) district!: string;
  @IsString() @MinLength(2) @MaxLength(80) state!: string;
  @IsString() @MinLength(10) @MaxLength(1000) description!: string;
  @IsOptional() @IsInt() @Min(2) @Max(16) capacity?: number;
}
