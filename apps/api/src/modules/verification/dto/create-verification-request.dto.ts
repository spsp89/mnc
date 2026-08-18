import { IsIn, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateVerificationRequestDto {
  @IsString() businessId!: string;
  @IsIn(["GST", "UDYAM", "TRADE_LICENSE", "PROFESSIONAL_REGISTRATION", "ADDRESS_PROOF", "OTHER"])
  documentType!: "GST" | "UDYAM" | "TRADE_LICENSE" | "PROFESSIONAL_REGISTRATION" | "ADDRESS_PROOF" | "OTHER";
  @IsString() @MinLength(10) @MaxLength(500) documentKey!: string;
  @IsString() @Matches(/^[a-f0-9]{64}$/) documentHash!: string;
}
