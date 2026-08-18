import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateClubReferralDto {
  @IsString() @MinLength(2) @MaxLength(120) contactName!: string;
  @IsOptional() @IsString() @MaxLength(160) referredBusiness?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
