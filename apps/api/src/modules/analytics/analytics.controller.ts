import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsRangeDto, BusinessAnalyticsQueryDto } from "./dto/analytics-range.dto";
import { TrackEventDto } from "./dto/track-event.dto";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("events")
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Record a minimised product analytics event" })
  track(@Body() input: TrackEventDto) {
    return this.analytics.track(input);
  }

  @Get("business")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  business(@Req() request: AuthenticatedRequest, @Query() query: BusinessAnalyticsQueryDto) {
    const { businessId, ...range } = query;
    return this.analytics.businessSummary(request.user.id, businessId, range);
  }

  @Get("business/dashboard")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  merchantDashboard(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.analytics.merchantDashboard(request.user.id, businessId);
  }

  @Get("platform")
  @ApiBearerAuth()
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  @UseGuards(JwtAuthGuard, RolesGuard)
  platform(@Query() range: AnalyticsRangeDto) {
    return this.analytics.platformSummary(range);
  }
}
