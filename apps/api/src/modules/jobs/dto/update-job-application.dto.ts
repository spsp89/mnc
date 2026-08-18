import { IsIn } from "class-validator";

export class UpdateJobApplicationDto {
  @IsIn(["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"])
  status!: "APPLIED" | "SHORTLISTED" | "REJECTED" | "HIRED";
}
