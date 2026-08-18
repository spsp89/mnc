import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsIn(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"])
  status?: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";

  @IsOptional()
  @IsBoolean()
  assignToMe?: boolean;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  note!: string;
}
