import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { CreateVerificationRequestDto } from "./dto/create-verification-request.dto";
import { DecideVerificationDto } from "./dto/decide-verification.dto";
import { VerificationService } from "./verification.service";

@ApiTags("verification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("verification")
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateVerificationRequestDto) {
    return this.verification.create(request.user.id, input);
  }

  @Get("mine")
  mine(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.verification.mine(request.user.id, businessId);
  }

  @Get("queue")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION")
  @UseGuards(RolesGuard)
  queue(@Query("status") status?: string) {
    return this.verification.queue(status);
  }

  @Get(":id")
  find(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.verification.find(request.user.id, request.user.role, id);
  }

  @Post(":id/decision")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "VERIFICATION")
  @UseGuards(RolesGuard)
  decide(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: DecideVerificationDto,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.verification.decide(id, request.user.id, input, requestId);
  }
}
