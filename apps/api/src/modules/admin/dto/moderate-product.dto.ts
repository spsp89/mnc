import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class ModerateProductDto {
  @IsIn(["PUBLISH", "REJECT"])
  action!: "PUBLISH" | "REJECT";

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason!: string;
}
