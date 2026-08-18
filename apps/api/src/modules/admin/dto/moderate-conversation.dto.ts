import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class ModerateConversationDto {
  @IsIn(["OPEN", "BLOCKED", "CLOSED"])
  status!: "OPEN" | "BLOCKED" | "CLOSED";
  @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}
