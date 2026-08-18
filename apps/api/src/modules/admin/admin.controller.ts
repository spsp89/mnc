import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { AdminService } from "./admin.service";
import { CreateRankingConfigurationDto } from "./dto/create-ranking-configuration.dto";
import { ModerateReviewDto } from "./dto/moderate-review.dto";
import { ModerateProductDto } from "./dto/moderate-product.dto";
import { ModerateConversationDto } from "./dto/moderate-conversation.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { AdminOperationDto, CreateAdminRecordDto } from "./dto/admin-operation.dto";
import { AdminMerchantActionDto } from "./dto/admin-merchant.dto";
import { AdminCategoryDto, AdminListingActionDto, AdminLocationDto, ReorderTaxonomyDto, UpdateAdminCategoryDto, UpdateAdminLocationDto } from "./dto/admin-taxonomy.dto";
import { AdminPlanDto, AdminSubscriptionActionDto, AdminSubscriptionQueryDto, AssignSubscriptionDto, ReorderPlansDto } from "./dto/admin-subscription.dto";
import { AdminReportQueryDto, AdminUserStatusDto } from "./dto/admin-report.dto";
import { AdminBannerDto } from "./dto/admin-banner.dto";
import { AdminPaymentActionDto, AdminPaymentQueryDto, AdminRefundQueryDto, CreateAutomaticRefundDto, CreateManualPaymentDto, CreateManualRefundDto } from "./dto/admin-payment.dto";
import { CreateManualOrderDto } from "./dto/admin-order.dto";
import { CreateTargetedOfferDto } from "./dto/admin-targeted-offer.dto";
import { CreateAdminAdvertisementDto } from "./dto/admin-advertisement.dto";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "STATE_ADMIN")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("ranking")
  @ApiOperation({ summary: "Get the active organic ranking configuration" })
  getRanking() {
    return this.admin.getActiveRanking();
  }

  @Post("ranking")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Create and optionally activate an audited ranking configuration" })
  createRanking(
    @Body() input: CreateRankingConfigurationDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.createRankingConfiguration(input, request.user.id, requestId);
  }

  @Get("overview")
  getOverview() {
    return this.admin.overview();
  }

  @Get("users")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "SUPPORT")
  users(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query("q") query?: string,
  ) {
    return this.admin.users(page, pageSize, query);
  }

  @Get("users/:id")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "SUPPORT")
  user(@Param("id") id: string) {
    return this.admin.user(id);
  }

  @Patch("users/:id/status")
  @Roles("SUPER_ADMIN")
  updateUserStatus(
    @Param("id") id: string,
    @Body() input: AdminUserStatusDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.updateUserStatus(id, input, request.user.id, requestId);
  }

  @Get("businesses")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION", "SALES")
  businesses(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query("q") query?: string,
  ) {
    return this.admin.businesses(page, pageSize, query);
  }

  @Get("merchants")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION")
  merchants(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query("q") query?: string,
    @Query("status") status?: string,
    @Query("planId") planId?: string,
    @Query("location") location?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.admin.merchants(page, pageSize, query, status, planId, location, from, to);
  }

  @Get("merchants/:merchantId")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION")
  merchant(@Param("merchantId") merchantId: string) {
    return this.admin.merchant(merchantId);
  }

  @Patch("merchants/:merchantId/status")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "VERIFICATION")
  updateMerchantStatus(
    @Param("merchantId") merchantId: string,
    @Body() input: AdminMerchantActionDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.updateMerchantStatus(merchantId, input, request.user.id, requestId);
  }

  @Get("categories")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  adminCategories() { return this.admin.adminCategories(); }

  @Post("categories")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  createCategory(@Body() input: AdminCategoryDto) { return this.admin.createCategory(input); }

  @Patch("categories/:id")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  updateCategory(@Param("id") id: string, @Body() input: UpdateAdminCategoryDto) { return this.admin.updateCategory(id, input); }

  @Put("categories/reorder")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  reorderCategories(@Body() input: ReorderTaxonomyDto) { return this.admin.reorderCategories(input); }

  @Delete("categories/:id")
  @Roles("SUPER_ADMIN")
  deleteCategory(@Param("id") id: string) { return this.admin.deleteCategory(id); }

  @Get("managed-locations")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN")
  managedLocations() { return this.admin.managedLocations(); }

  @Post("managed-locations")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  createLocation(@Body() input: AdminLocationDto) { return this.admin.createManagedLocation(input); }

  @Patch("managed-locations/:id")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  updateLocation(@Param("id") id: string, @Body() input: UpdateAdminLocationDto) { return this.admin.updateManagedLocation(id, input); }

  @Put("managed-locations/reorder")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  reorderLocations(@Body() input: ReorderTaxonomyDto) { return this.admin.reorderManagedLocations(input); }

  @Delete("managed-locations/:id")
  @Roles("SUPER_ADMIN")
  deleteLocation(@Param("id") id: string) { return this.admin.deleteManagedLocation(id); }

  @Get("listings")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION", "MODERATOR")
  listings(@Query("page", new ParseIntPipe({ optional: true })) page?: number, @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number, @Query("q") q?: string, @Query("status") status?: string, @Query("categoryId") categoryId?: string, @Query("locationId") locationId?: string) {
    return this.admin.listings(page, pageSize, { q, status, categoryId, locationId });
  }

  @Get("listings/:id")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "AREA_MANAGER", "VERIFICATION", "MODERATOR")
  listing(@Param("id") id: string) { return this.admin.merchant(id); }

  @Patch("listings/:id/status")
  @Roles("SUPER_ADMIN", "STATE_ADMIN", "MODERATOR")
  updateListingStatus(@Param("id") id: string, @Body() input: AdminListingActionDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.updateListingStatus(id, input, request.user.id, requestId);
  }

  @Get("reviews/moderation")
  @Roles("SUPER_ADMIN", "MODERATOR")
  reviewModeration(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.admin.reviewModeration(page, pageSize);
  }

  @Patch("reviews/:reviewId/moderate")
  @Roles("SUPER_ADMIN", "MODERATOR")
  moderateReview(
    @Param("reviewId") reviewId: string,
    @Body() input: ModerateReviewDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.moderateReview(reviewId, input, request.user.id, requestId);
  }

  @Get("products/moderation")
  @Roles("SUPER_ADMIN", "MODERATOR")
  productModeration(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.admin.productModeration(page, pageSize);
  }

  @Patch("products/:productId/moderate")
  @Roles("SUPER_ADMIN", "MODERATOR")
  moderateProduct(
    @Param("productId") productId: string,
    @Body() input: ModerateProductDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.moderateProduct(productId, input, request.user.id, requestId);
  }

  @Get("conversations")
  @Roles("SUPER_ADMIN", "MODERATOR", "SUPPORT")
  conversations(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.admin.conversations(page, pageSize);
  }

  @Get("conversations/:conversationId/messages")
  @Roles("SUPER_ADMIN", "MODERATOR", "SUPPORT")
  conversationMessages(@Param("conversationId") conversationId: string) {
    return this.admin.conversationMessages(conversationId);
  }

  @Patch("conversations/:conversationId")
  @Roles("SUPER_ADMIN", "MODERATOR")
  moderateConversation(
    @Param("conversationId") conversationId: string,
    @Body() input: ModerateConversationDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.moderateConversation(conversationId, input, request.user.id, requestId);
  }

  @Get("inventory/:section")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Read an allowlisted operational inventory section" })
  inventory(@Param("section") section: string) {
    return this.admin.inventory(section);
  }

  @Get("services/options")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "List businesses and their linked categories for service administration" })
  serviceOptions() {
    return this.admin.serviceOptions();
  }

  @Post("operations/:section")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Create an allowlisted operational record with an audit entry" })
  createOperationalRecord(
    @Param("section") section: string,
    @Body() input: CreateAdminRecordDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.createOperationalRecord(section, input, request.user.id, requestId);
  }

  @Patch("operations/:section/:recordId")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Apply an allowlisted operational action with an audit entry" })
  applyOperationalAction(
    @Param("section") section: string,
    @Param("recordId") recordId: string,
    @Body() input: AdminOperationDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.applyOperationalAction(
      section,
      recordId,
      input,
      request.user.id,
      requestId,
    );
  }

  @Get("support")
  @Roles("SUPER_ADMIN", "SUPPORT")
  support(@Query("page", new ParseIntPipe({ optional: true })) page?: number) {
    return this.admin.support(page);
  }

  @Patch("support/:ticketId")
  @Roles("SUPER_ADMIN", "SUPPORT")
  updateSupport(
    @Param("ticketId") ticketId: string,
    @Body() input: UpdateSupportTicketDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.updateSupportTicket(ticketId, input, request.user.id, requestId);
  }

  @Get("finance")
  @Roles("SUPER_ADMIN", "FINANCE")
  finance() {
    return this.admin.finance();
  }

  @Get("payments")
  @Roles("SUPER_ADMIN", "FINANCE")
  payments(@Query() input: AdminPaymentQueryDto) { return this.admin.payments(input); }

  @Post("payments")
  @Roles("SUPER_ADMIN", "FINANCE")
  createManualPayment(@Body() input: CreateManualPaymentDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createManualPayment(input, request.user.id, requestId);
  }

  @Patch("payments/:id/status")
  @Roles("SUPER_ADMIN", "FINANCE")
  updatePaymentStatus(@Param("id") id: string, @Body() input: AdminPaymentActionDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.updatePaymentStatus(id, input, request.user.id, requestId);
  }

  @Get("refunds")
  @Roles("SUPER_ADMIN", "FINANCE")
  refunds(@Query() input: AdminRefundQueryDto) { return this.admin.refunds(input); }

  @Get("refunds/options")
  @Roles("SUPER_ADMIN", "FINANCE")
  refundablePayments() { return this.admin.refundablePayments(); }

  @Post("refunds/manual")
  @Roles("SUPER_ADMIN", "FINANCE")
  createManualRefund(@Body() input: CreateManualRefundDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createManualRefund(input, request.user.id, requestId);
  }

  @Post("refunds/automatic")
  @Roles("SUPER_ADMIN", "FINANCE")
  createAutomaticRefund(@Body() input: CreateAutomaticRefundDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createAutomaticRefund(input, request.user.id, requestId);
  }

  @Get("orders/options")
  @Roles("SUPER_ADMIN", "SALES")
  manualOrderOptions() { return this.admin.manualOrderOptions(); }

  @Post("orders")
  @Roles("SUPER_ADMIN", "SALES")
  createManualOrder(@Body() input: CreateManualOrderDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createManualOrder(input, request.user.id, requestId);
  }

  @Get("offers/options")
  @Roles("SUPER_ADMIN", "SALES")
  targetedOfferOptions() { return this.admin.targetedOfferOptions(); }

  @Post("offers/targeted")
  @Roles("SUPER_ADMIN", "SALES")
  createTargetedOffer(@Body() input: CreateTargetedOfferDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createTargetedOffer(input, request.user.id, requestId);
  }

  @Get("advertisements/options")
  @Roles("SUPER_ADMIN", "SALES")
  advertisementOptions() { return this.admin.advertisementOptions(); }

  @Post("advertisements")
  @Roles("SUPER_ADMIN", "SALES")
  createAdvertisement(@Body() input: CreateAdminAdvertisementDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createAdvertisement(input, request.user.id, requestId);
  }

  @Get("reports/summary")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  reportSummary(@Query() query: AdminReportQueryDto) {
    return this.admin.reportSummary(query);
  }

  @Get("subscription-plans")
  @Roles("SUPER_ADMIN", "FINANCE")
  subscriptionPlans() {
    return this.admin.subscriptionPlans();
  }

  @Post("subscription-plans")
  @Roles("SUPER_ADMIN")
  createSubscriptionPlan(
    @Body() input: AdminPlanDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.createSubscriptionPlan(input, request.user.id, requestId);
  }

  @Patch("subscription-plans/:id")
  @Roles("SUPER_ADMIN")
  updateSubscriptionPlan(
    @Param("id") id: string,
    @Body() input: AdminPlanDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.updateSubscriptionPlan(id, input, request.user.id, requestId);
  }

  @Post("subscription-plans/reorder")
  @Roles("SUPER_ADMIN")
  reorderSubscriptionPlans(
    @Body() input: ReorderPlansDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.reorderSubscriptionPlans(input, request.user.id, requestId);
  }

  @Get("subscriptions")
  @Roles("SUPER_ADMIN", "FINANCE")
  subscriptions(@Query() input: AdminSubscriptionQueryDto) {
    return this.admin.subscriptions(input);
  }

  @Post("subscriptions")
  @Roles("SUPER_ADMIN", "FINANCE")
  assignSubscription(
    @Body() input: AssignSubscriptionDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.assignSubscription(input, request.user.id, requestId);
  }

  @Patch("subscriptions/:id")
  @Roles("SUPER_ADMIN", "FINANCE")
  updateSubscription(
    @Param("id") id: string,
    @Body() input: AdminSubscriptionActionDto,
    @Req() request: AuthenticatedRequest,
    @Headers("x-request-id") requestId = crypto.randomUUID(),
  ) {
    return this.admin.updateSubscription(id, input, request.user.id, requestId);
  }

  @Get("audit-log")
  @Roles("SUPER_ADMIN")
  auditLog(@Query("page", new ParseIntPipe({ optional: true })) page?: number) {
    return this.admin.auditLog(page);
  }

  @Get("banners")
  @Roles("SUPER_ADMIN", "STATE_ADMIN")
  banners() { return this.admin.banners(); }

  @Post("banners")
  @Roles("SUPER_ADMIN")
  createBanner(@Body() input: AdminBannerDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.createBanner(input, request.user.id, requestId);
  }

  @Patch("banners/:id")
  @Roles("SUPER_ADMIN")
  updateBanner(@Param("id") id: string, @Body() input: AdminBannerDto, @Req() request: AuthenticatedRequest, @Headers("x-request-id") requestId = crypto.randomUUID()) {
    return this.admin.updateBanner(id, input, request.user.id, requestId);
  }
}
