import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ApplyJobDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(3000) coverNote?: string;
  @IsOptional() @IsString() @MaxLength(600) resumeObjectKey?: string;
}
