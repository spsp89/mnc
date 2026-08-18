import { Body, Controller, Get, Headers, Param, Patch, Post, Query, RawBodyRequest, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { DeliveriesService } from "./deliveries.service";
import { OrderDeliveryDto } from "./dto/order-delivery.dto";
import {
  CaptureDeliveryProofDto,
  SettleDeliveryDto,
  UpdateDeliveryDispatchDto,
} from "./dto/delivery-lifecycle.dto";

@ApiTags("deliveries")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("deliveries")
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get("readiness")
  readiness() {
    return this.deliveries.readiness();
  }

  @Get("manage")
  manage(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.deliveries.manage(request.user.id, businessId);
  }

  @Post("quote")
  quote(@Req() request: AuthenticatedRequest, @Body() input: OrderDeliveryDto) {
    return this.deliveries.quote(request.user.id, input.orderId);
  }

  @Post("create")
  create(@Req() request: AuthenticatedRequest, @Body() input: OrderDeliveryDto) {
    return this.deliveries.create(request.user.id, input.orderId);
  }

  @Get(":orderId")
  track(@Req() request: AuthenticatedRequest, @Param("orderId") orderId: string) {
    return this.deliveries.track(request.user.id, orderId);
  }

  @Post(":orderId/cancel")
  cancel(@Req() request: AuthenticatedRequest, @Param("orderId") orderId: string) {
    return this.deliveries.cancel(request.user.id, orderId);
  }

  @Patch(":orderId/dispatch")
  updateDispatch(
    @Req() request: AuthenticatedRequest,
    @Param("orderId") orderId: string,
    @Body() input: UpdateDeliveryDispatchDto,
  ) {
    return this.deliveries.updateDispatch(request.user.id, orderId, input);
  }

  @Post(":orderId/proof")
  captureProof(
    @Req() request: AuthenticatedRequest,
    @Param("orderId") orderId: string,
    @Body() input: CaptureDeliveryProofDto,
  ) {
    return this.deliveries.captureProof(request.user.id, orderId, input);
  }

  @Post(":orderId/settle")
  settle(
    @Req() request: AuthenticatedRequest,
    @Param("orderId") orderId: string,
    @Body() input: SettleDeliveryDto,
  ) {
    return this.deliveries.settle(request.user.id, orderId, input);
  }
}

@ApiTags("delivery webhooks")
@Controller("deliveries/webhooks")
export class DeliveryWebhooksController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Post(":provider")
  @SkipThrottle()
  @ApiOperation({ summary: "Receive signed, idempotent delivery-provider webhooks" })
  receive(
    @Param("provider") provider: string,
    @Req() request: RawBodyRequest<Request>,
    @Headers("x-bnc-delivery-signature") signature: string | undefined,
    @Headers("x-bnc-delivery-event-id") eventId: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    if (!request.rawBody) throw new Error("Raw delivery webhook body is unavailable.");
    return this.deliveries.webhook(provider, signature, eventId, request.rawBody, payload);
  }
}
