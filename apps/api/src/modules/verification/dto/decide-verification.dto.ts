import { IsIn, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class DecideVerificationDto {
  @IsIn(["APPROVED", "MORE_INFORMATION", "REJECTED"])
  status!: "APPROVED" | "MORE_INFORMATION" | "REJECTED";

  @IsString()
  @MinLength(12)
  @MaxLength(2000)
  notes!: string;

  @ValidateIf((input: DecideVerificationDto) => input.status === "REJECTED")
  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  rejectionReason?: string;
}
