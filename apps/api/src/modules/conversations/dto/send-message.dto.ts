import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

export class SendMessageDto {
  @IsIn(["TEXT", "IMAGE", "DOCUMENT"])
  type!: "TEXT" | "IMAGE" | "DOCUMENT";

  @ValidateIf((input: SendMessageDto) => input.type === "TEXT")
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body?: string;

  @ValidateIf((input: SendMessageDto) => input.type !== "TEXT")
  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9/_.-]{2,500}$/)
  attachmentKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
