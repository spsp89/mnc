import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateServiceDto } from "./dto/create-service.dto";
import { ListServicesDto } from "./dto/list-services.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@ApiTags("services")
@Controller("services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @ApiOperation({ summary: "List active local services" })
  list(@Query() query: ListServicesDto) {
    return this.services.list(query);
  }

  @Get("manage")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List services owned by an authorised business workspace" })
  manage(
    @Req() request: AuthenticatedRequest,
    @Query("businessId") businessId: string,
  ) {
    return this.services.manage(request.user.id, businessId);
  }

  @Get(":id")
  find(@Param("id") id: string) {
    return this.services.find(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateServiceDto) {
    return this.services.create(request.user.id, input);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateServiceDto) {
    return this.services.update(request.user.id, id, input);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  archive(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.services.archive(request.user.id, id);
  }
}
