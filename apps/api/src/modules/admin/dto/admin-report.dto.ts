import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AdminReportQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class AdminUserStatusDto {
  @IsIn(["PENDING", "ACTIVE", "SUSPENDED"])
  status!: "PENDING" | "ACTIVE" | "SUSPENDED";

  @IsString() @MinLength(8) @MaxLength(500)
  reason!: string;
}
