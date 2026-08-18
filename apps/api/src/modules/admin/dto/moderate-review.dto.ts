import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class ModerateReviewDto {
  @IsIn(["PUBLISH", "REMOVE"])
  action!: "PUBLISH" | "REMOVE";

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  reason!: string;
}
