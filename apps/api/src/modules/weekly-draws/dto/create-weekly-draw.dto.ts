import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateWeeklyDrawDto {
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsString() @MinLength(3) @MaxLength(500) prizeDescription!: string;
  @IsDateString() weekStartsAt!: string;
  @IsDateString() weekEndsAt!: string;
  @IsOptional() @IsIn(["WEEKLY", "MONTHLY", "FESTIVAL"]) kind?: "WEEKLY" | "MONTHLY" | "FESTIVAL";
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) occasion?: string;
  @IsOptional() @IsNumber() @Min(200) minimumPurchase?: number;
}
