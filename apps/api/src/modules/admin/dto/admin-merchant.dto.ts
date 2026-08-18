import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class AdminMerchantActionDto {
  @IsIn(["APPROVE", "REJECT", "SUSPEND", "REACTIVATE"])
  action!: "APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE";

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  reason!: string;
}
