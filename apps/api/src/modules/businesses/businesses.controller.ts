import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { BusinessesService } from "./businesses.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { ListBusinessesDto } from "./dto/list-businesses.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { AddBusinessMemberDto } from "./dto/add-business-member.dto";
import { UpdateBusinessMemberDto } from "./dto/update-business-member.dto";
import { UpdateBusinessCategoriesDto } from "./dto/update-business-categories.dto";
import { AttachBusinessMediaDto } from "./dto/attach-business-media.dto";
import { ListingActionDto } from "./dto/listing-action.dto";

@ApiTags("businesses")
@Controller("businesses")
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  @ApiOperation({ summary: "List active businesses" })
  list(@Query() query: ListBusinessesDto) {
    return this.businesses.list(query);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a draft business profile" })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateBusinessDto,
  ) {
    return this.businesses.create(request.user.id, input);
  }

  @Get("mine")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List businesses the current owner or team member can manage" })
  mine(@Req() request: AuthenticatedRequest) {
    return this.businesses.mine(request.user.id);
  }

  @Get("manage/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get a complete managed business record" })
  managed(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.businesses.managed(request.user.id, id);
  }

  @Patch("manage/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: UpdateBusinessDto,
  ) {
    return this.businesses.update(request.user.id, id, input);
  }

  @Post("manage/:id/listing-action")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Publish, unpublish, or archive an owned listing" })
  listingAction(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: ListingActionDto) {
    return this.businesses.listingAction(request.user.id, id, input.action);
  }

  @Put("manage/:id/categories")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Replace business categories within the active plan limit" })
  updateCategories(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: UpdateBusinessCategoriesDto,
  ) {
    return this.businesses.updateCategories(request.user.id, id, input);
  }

  @Post("manage/:id/media")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Attach a logo, banner or plan-limited gallery photo" })
  attachMedia(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: AttachBusinessMediaDto,
  ) {
    return this.businesses.attachMedia(request.user.id, id, input);
  }

  @Delete("manage/:id/media/:mediaId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Remove a business gallery photo" })
  removeMedia(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("mediaId") mediaId: string,
  ) {
    return this.businesses.removeMedia(request.user.id, id, mediaId);
  }

  @Get("manage/:id/team")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List owner and team access for a business workspace" })
  team(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.businesses.team(request.user.id, id);
  }

  @Post("manage/:id/team")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Add or reactivate an existing BNC user as a team member" })
  addTeamMember(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: AddBusinessMemberDto,
  ) {
    return this.businesses.addTeamMember(request.user.id, id, input);
  }

  @Patch("manage/:id/team/:memberId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Change a business team member role or access state" })
  updateTeamMember(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() input: UpdateBusinessMemberDto,
  ) {
    return this.businesses.updateTeamMember(request.user.id, id, memberId, input);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get a public business profile" })
  findBySlug(@Param("slug") slug: string) {
    return this.businesses.findBySlug(slug);
  }
}
