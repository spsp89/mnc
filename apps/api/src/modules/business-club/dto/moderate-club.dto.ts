import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class ModerateClubMembershipDto {
  @IsIn(["ACTIVE", "SUSPENDED", "LEFT"])
  status!: "ACTIVE" | "SUSPENDED" | "LEFT";

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class ModerateClubMessageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
