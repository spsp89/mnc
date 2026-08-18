import { IsIn } from "class-validator";

export class UpdateClubReferralDto {
  @IsIn(["NEW", "CONTACTED", "CONVERTED", "CLOSED"])
  status!: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
}
