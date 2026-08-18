import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterPushDeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096) token!: string;
  @IsIn(["android", "ios", "web"]) platform!: "android" | "ios" | "web";
  @IsOptional() @IsString() @MaxLength(120) deviceName?: string;
  @IsOptional() @IsString() @MaxLength(40) appVersion?: string;
}

export class UnregisterPushDeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096) token!: string;
}
