import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { LeadsService } from "./leads.service";
import { CreateReferralDto } from "./dto/create-referral.dto";
import { UpdateReferralDto } from "./dto/update-referral.dto";
import { CreateSearchIntentDto } from "./dto/create-search-intent.dto";

@ApiTags("leads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post("search-intents")
  @ApiOperation({ summary: "Create a privacy-safe lead signal from an authenticated customer search" })
  searchIntent(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateSearchIntentDto,
  ) {
    return this.leads.createSearchIntent(request.user.id, input);
  }

  @Get("referrals")
  referrals(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.leads.referrals(request.user.id, businessId);
  }

  @Post("referrals")
  createReferral(@Req() request: AuthenticatedRequest, @Body() input: CreateReferralDto) {
    return this.leads.createReferral(request.user.id, input);
  }

  @Patch("referrals/:id")
  updateReferral(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: UpdateReferralDto,
  ) {
    return this.leads.updateReferral(request.user.id, id, input);
  }

  @Get(":id/status")
  @ApiOperation({ summary: "Get lead matching status" })
  status(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.leads.status(request.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: "List active lead assignments for a managed business" })
  list(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.leads.listForBusiness(request.user.id, businessId);
  }

  @Post("assignments/:assignmentId/accept")
  accept(@Req() request: AuthenticatedRequest, @Param("assignmentId") assignmentId: string) {
    return this.leads.accept(request.user.id, assignmentId);
  }

  @Post("assignments/:assignmentId/decline")
  decline(@Req() request: AuthenticatedRequest, @Param("assignmentId") assignmentId: string) {
    return this.leads.decline(request.user.id, assignmentId);
  }
}
