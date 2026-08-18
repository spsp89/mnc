import { IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class TrackEventDto {
  @IsIn(["SEARCH_IMPRESSION", "PROFILE_VIEW", "CALL_CLICK", "WHATSAPP_CLICK", "DIRECTIONS_CLICK", "SAVE_BUSINESS", "ENQUIRY_START", "ENQUIRY_SUBMITTED"])
  eventType!: "SEARCH_IMPRESSION" | "PROFILE_VIEW" | "CALL_CLICK" | "WHATSAPP_CLICK" | "DIRECTIONS_CLICK" | "SAVE_BUSINESS" | "ENQUIRY_START" | "ENQUIRY_SUBMITTED";
  @IsString() @MinLength(12) @MaxLength(120) sessionId!: string;
  @IsOptional() @IsString() businessId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(100) locality?: string;
  @IsOptional() @IsString() @MaxLength(80) source?: string;
  @IsOptional() @IsObject() metadata?: Record<string, string | number | boolean | null>;
}
