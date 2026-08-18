import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator";

export class UpdateBusinessCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  categoryIds!: string[];

  @IsOptional()
  @IsString()
  primaryCategoryId?: string;
}
