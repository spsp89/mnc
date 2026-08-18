import { IsNumber, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class IssueDrawEntryDto {
  @IsString() @MinLength(1) @MaxLength(64) businessId!: string;
  @IsNumber() @Min(200) purchaseAmount!: number;
  @IsOptional() @IsString() @MaxLength(120) receiptReference?: string;
}

export class ClaimDrawEntryDto {
  @IsString()
  @Matches(/^BNC-[A-Z0-9]{4}-[A-Z0-9]{4}$/i)
  code!: string;
}
