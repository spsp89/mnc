import { IsString, MaxLength, MinLength } from "class-validator";

export class ReplyReviewDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1500)
  body!: string;
}
