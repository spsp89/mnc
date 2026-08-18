import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { CreateWeeklyDrawDto } from "./dto/create-weekly-draw.dto";
import { ClaimDrawEntryDto, IssueDrawEntryDto } from "./dto/draw-entry.dto";
import { WeeklyDrawsService } from "./weekly-draws.service";

@ApiTags("weekly draws")
@Controller("weekly-draws")
export class WeeklyDrawsController {
  constructor(private readonly draws: WeeklyDrawsService) {}

  @Get()
  list() {
    return this.draws.publicDraws();
  }

  @Get("entries/me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  myEntries(@Req() request: AuthenticatedRequest) {
    return this.draws.myEntries(request.user.id);
  }

  @Post("entries/claim")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  claim(@Req() request: AuthenticatedRequest, @Body() input: ClaimDrawEntryDto) {
    return this.draws.claimEntry(request.user.id, input);
  }

  @Get(":id/entries")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  entriesForBusiness(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("businessId") businessId: string,
  ) {
    return this.draws.entriesForBusiness(request.user.id, id, businessId);
  }

  @Post(":id/entries")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  issueEntry(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: IssueDrawEntryDto,
  ) {
    return this.draws.issueEntry(request.user.id, id, input);
  }
}

@ApiTags("admin weekly draws")
@ApiBearerAuth()
@Controller("admin/weekly-draws")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class AdminWeeklyDrawsController {
  constructor(private readonly draws: WeeklyDrawsService) {}

  @Get()
  list() {
    return this.draws.adminList();
  }

  @Post()
  create(@Body() input: CreateWeeklyDrawDto) {
    return this.draws.create(input);
  }

  @Post(":id/open")
  open(@Param("id") id: string) {
    return this.draws.open(id);
  }

  @Post(":id/select-winner")
  selectWinner(@Param("id") id: string) {
    return this.draws.selectWinner(id);
  }

  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.draws.publish(id);
  }
}
