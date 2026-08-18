import { IsBoolean, IsIn, IsObject, IsString, MaxLength } from "class-validator";

export class ConsentDto {
  @IsString()
  @MaxLength(80)
  type!: string;

  @IsObject()
  scope!: Record<string, unknown>;

  @IsBoolean()
  granted!: boolean;

  @IsIn(["web", "mobile", "support", "import"])
  source!: "web" | "mobile" | "support" | "import";
}
