import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get("plans")
  @ApiOperation({ summary: "List active business subscription plans" })
  plans() {
    return this.subscriptions.plans();
  }

  @Get("current")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  current(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.subscriptions.current(request.user.id, businessId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateSubscriptionDto) {
    return this.subscriptions.create(request.user.id, input);
  }

  @Post(":id/cancel")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancel(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.subscriptions.cancel(request.user.id, id);
  }
}
