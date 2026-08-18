import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportReviewDto {
  @IsIn(["spam", "abuse", "conflict_of_interest", "privacy", "other"])
  reason!: "spam" | "abuse" | "conflict_of_interest" | "privacy" | "other";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
