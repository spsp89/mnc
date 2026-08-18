import { IsIn } from "class-validator";

export class UpdateReferralDto {
  @IsIn(["NEW", "CONTACTED", "CONVERTED", "CLOSED"])
  status!: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
}
