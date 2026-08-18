import { Controller, Get, Query } from "@nestjs/common";
import { IsIn, IsOptional } from "class-validator";
import { bannerPlacements } from "../admin/dto/admin-banner.dto";
import { ContentService } from "./content.service";

class BannerQueryDto {
  @IsOptional() @IsIn(bannerPlacements) placement?: (typeof bannerPlacements)[number];
}

@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}
  @Get("banners") banners(@Query() query: BannerQueryDto) { return this.content.banners(query.placement); }
}
