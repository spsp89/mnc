import { IsString } from "class-validator";

export class JoinChapterDto {
  @IsString() businessId!: string;
}
