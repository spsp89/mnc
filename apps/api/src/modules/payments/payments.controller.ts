import { Body, Controller, Get, Headers, Post, Query, RawBodyRequest, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { PaymentWebhookService } from "./payment-webhook.service";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly webhooks: PaymentWebhookService,
  ) {}

  @Post("checkout")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create an idempotent Razorpay order on the server" })
  checkout(@Req() request: AuthenticatedRequest, @Body() input: CreateCheckoutDto) {
    return this.payments.createCheckout(request.user.id, input);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@Req() request: AuthenticatedRequest) {
    return this.payments.listForUser(request.user.id);
  }

  @Get("business")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List payment and settlement records for an authorised business" })
  business(
    @Req() request: AuthenticatedRequest,
    @Query("businessId") businessId: string,
  ) {
    return this.payments.listForBusiness(request.user.id, businessId);
  }

  @Post("webhooks/razorpay")
  @SkipThrottle()
  @ApiOperation({ summary: "Receive signed, idempotent Razorpay webhooks" })
  webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature?: string,
    @Headers("x-razorpay-event-id") eventId?: string,
  ) {
    if (!request.rawBody) throw new Error("Raw webhook body is unavailable.");
    return this.webhooks.accept(request.rawBody, signature, eventId);
  }
}
