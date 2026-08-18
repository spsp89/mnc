import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  enquiryId?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  initialMessage?: string;
}
