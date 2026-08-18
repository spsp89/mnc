import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { BusinessClubService } from "./business-club.service";
import { CreateClubEventDto } from "./dto/create-club-event.dto";
import { CreateClubReferralDto } from "./dto/create-club-referral.dto";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { JoinChapterDto } from "./dto/join-chapter.dto";
import { ModerateClubMembershipDto, ModerateClubMessageDto } from "./dto/moderate-club.dto";
import { SendClubMessageDto } from "./dto/send-club-message.dto";
import { UpdateClubReferralDto } from "./dto/update-club-referral.dto";

@ApiTags("business club")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("business-club")
export class BusinessClubController {
  constructor(private readonly club: BusinessClubService) {}

  @Get("chapters")
  chapters(@Req() request: AuthenticatedRequest) {
    return this.club.chapters(request.user.id);
  }

  @Get("overview")
  overview() {
    return this.club.overview();
  }

  @Post("chapters/:id/join")
  join(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: JoinChapterDto) {
    return this.club.join(request.user.id, id, input.businessId);
  }

  @Get("chapters/:id/messages")
  messages(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.club.messages(request.user.id, id);
  }

  @Post("chapters/:id/messages")
  send(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: SendClubMessageDto,
  ) {
    return this.club.send(request.user.id, id, input);
  }

  @Get("chapters/:id/members")
  members(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.club.members(request.user.id, id);
  }

  @Get("chapters/:id/events")
  events(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.club.events(request.user.id, id);
  }

  @Post("chapters/:id/events")
  createEvent(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: CreateClubEventDto,
  ) {
    return this.club.createEvent(request.user.id, id, input);
  }

  @Post("chapters/:id/events/:eventId/register")
  registerForEvent(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("eventId") eventId: string,
  ) {
    return this.club.registerForEvent(request.user.id, id, eventId);
  }

  @Delete("chapters/:id/events/:eventId/register")
  cancelEventRegistration(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("eventId") eventId: string,
  ) {
    return this.club.cancelEventRegistration(request.user.id, id, eventId);
  }

  @Get("chapters/:id/referrals")
  referrals(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.club.referrals(request.user.id, id);
  }

  @Post("chapters/:id/referrals")
  createReferral(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: CreateClubReferralDto,
  ) {
    return this.club.createReferral(request.user.id, id, input);
  }

  @Patch("chapters/:id/referrals/:referralId")
  updateReferral(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("referralId") referralId: string,
    @Body() input: UpdateClubReferralDto,
  ) {
    return this.club.updateReferral(request.user.id, id, referralId, input);
  }
}

@ApiTags("admin business club")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("admin/business-club")
export class AdminBusinessClubController {
  constructor(private readonly club: BusinessClubService) {}

  @Get()
  @Roles("SUPER_ADMIN", "MODERATOR")
  overview() {
    return this.club.adminOverview();
  }

  @Post("chapters")
  @Roles("SUPER_ADMIN")
  createChapter(@Body() input: CreateChapterDto) {
    return this.club.createChapter(input);
  }

  @Patch("memberships/:id")
  @Roles("SUPER_ADMIN", "MODERATOR")
  moderateMembership(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: ModerateClubMembershipDto,
  ) {
    return this.club.moderateMembership(request.user.id, id, input.status, input.reason);
  }

  @Delete("messages/:id")
  @Roles("SUPER_ADMIN", "MODERATOR")
  moderateMessage(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: ModerateClubMessageDto,
  ) {
    return this.club.moderateMessage(request.user.id, id, input.reason);
  }
}
