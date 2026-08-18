import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReplyReviewDto } from "./dto/reply-review.dto";
import { ReportReviewDto } from "./dto/report-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List reviews created by the authenticated customer" })
  mine(@Req() request: AuthenticatedRequest) {
    return this.reviews.mine(request.user.id);
  }

  @Get("business/:businessId")
  @ApiOperation({ summary: "List published reviews for a business" })
  list(
    @Param("businessId") businessId: string,
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.reviews.list(businessId, page, pageSize);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateReviewDto) {
    return this.reviews.create(request.user.id, input);
  }

  @Patch(":reviewId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param("reviewId") reviewId: string,
    @Body() input: UpdateReviewDto,
  ) {
    return this.reviews.update(request.user.id, reviewId, input);
  }

  @Delete(":reviewId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param("reviewId") reviewId: string) {
    return this.reviews.remove(request.user.id, reviewId);
  }

  @Post(":reviewId/reply")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  reply(@Req() request: AuthenticatedRequest, @Param("reviewId") reviewId: string, @Body() input: ReplyReviewDto) {
    return this.reviews.reply(request.user.id, reviewId, input);
  }

  @Post(":reviewId/helpful")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  helpful(@Req() request: AuthenticatedRequest, @Param("reviewId") reviewId: string) {
    return this.reviews.markHelpful(request.user.id, reviewId);
  }

  @Post(":reviewId/report")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  report(
    @Req() request: AuthenticatedRequest,
    @Param("reviewId") reviewId: string,
    @Body() input: ReportReviewDto,
  ) {
    return this.reviews.report(request.user.id, reviewId, input);
  }
}
