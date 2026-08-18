import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SearchBusinessesDto } from "./dto/search-businesses.dto";
import { SearchService } from "./search.service";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("businesses")
  @ApiOperation({ summary: "Location-aware business search with transparent paid placement" })
  search(@Query() query: SearchBusinessesDto) {
    return this.searchService.search(query);
  }
}

