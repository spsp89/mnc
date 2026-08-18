import { IsEmail, IsString, Matches, MaxLength } from "class-validator";

export class EmailVerifyDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^[0-9]{6}$/)
  code!: string;
}
