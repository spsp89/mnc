import { IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AdminOperationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  action!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  value?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  reason!: string;
}

export class CreateAdminRecordDto {
  @IsObject()
  data!: Record<string, unknown>;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  reason!: string;
}
