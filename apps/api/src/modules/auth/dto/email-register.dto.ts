import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class EmailRegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string;
}
