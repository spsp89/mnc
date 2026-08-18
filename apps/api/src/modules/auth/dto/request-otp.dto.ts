import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsString, Matches } from "class-validator";

export class RequestOtpDto {
  @ApiProperty({ example: "+919876543210" })
  @Transform(({ value }: { value: unknown }) => String(value).replace(/[^\d+]/g, ""))
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  phone!: string;

  @ApiProperty({ enum: ["login", "register", "verify"], default: "login" })
  @IsIn(["login", "register", "verify"])
  purpose!: "login" | "register" | "verify";
}

