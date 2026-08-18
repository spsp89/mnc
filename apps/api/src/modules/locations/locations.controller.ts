import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SuggestLocationsDto } from "./dto/suggest-locations.dto";
import { LocationsService } from "./locations.service";

@ApiTags("locations")
@Controller("locations")
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get("tree")
  @ApiOperation({ summary: "List the active managed location hierarchy" })
  tree() { return this.locations.tree(); }

  @Get("cities")
  @ApiOperation({ summary: "List active cities and public business counts" })
  cities(@Query("state") state?: string) {
    return this.locations.cities(state);
  }

  @Get("suggest")
  @ApiOperation({ summary: "Suggest localities, cities and postal codes" })
  suggest(@Query() query: SuggestLocationsDto) {
    return this.locations.suggest(query);
  }
}
