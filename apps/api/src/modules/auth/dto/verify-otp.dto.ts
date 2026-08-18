import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsString, Matches } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({ example: "+919876543210" })
  @Transform(({ value }: { value: unknown }) => String(value).replace(/[^\d+]/g, ""))
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  phone!: string;

  @ApiProperty({ example: "482913" })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @ApiProperty({ enum: ["login", "register", "verify"] })
  @IsIn(["login", "register", "verify"])
  purpose!: "login" | "register" | "verify";
}

