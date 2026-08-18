import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateBookingDto {
  @IsIn(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
  status!: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  @IsOptional() @IsString() @MaxLength(2000) businessNote?: string;
}
