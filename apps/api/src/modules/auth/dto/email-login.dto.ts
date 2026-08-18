import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class EmailLoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
