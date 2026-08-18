import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";

const supportTopics = [
  "general",
  "account",
  "billing",
  "privacy",
  "trust_safety",
  "other",
] as const;

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsIn(supportTopics)
  topic!: (typeof supportTopics)[number];

  @IsString()
  @MinLength(15)
  @MaxLength(2000)
  message!: string;
}
