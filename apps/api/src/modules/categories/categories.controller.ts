import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Get the active category tree" })
  tree(@Query("language") language?: string) {
    return this.categories.tree(language);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get category detail by slug" })
  bySlug(@Param("slug") slug: string) {
    return this.categories.bySlug(slug);
  }
}
