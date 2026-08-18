import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { ListOffersDto } from "./dto/list-offers.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";
import { OffersService } from "./offers.service";

@ApiTags("offers")
@Controller("offers")
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  @ApiOperation({ summary: "List active local offers" })
  list(@Query() query: ListOffersDto) {
    return this.offers.list(query);
  }

  @Get("mine")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List private offers assigned to the authenticated customer" })
  mine(@Req() request: AuthenticatedRequest) {
    return this.offers.mine(request.user.id);
  }

  @Get("manage")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List offers and eligible catalogue items for a managed business" })
  manage(
    @Req() request: AuthenticatedRequest,
    @Query("businessId") businessId: string,
  ) {
    return this.offers.manage(request.user.id, businessId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateOfferDto) {
    return this.offers.create(request.user.id, input);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateOfferDto) {
    return this.offers.update(request.user.id, id, input);
  }
}
