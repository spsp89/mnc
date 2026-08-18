import { Body, Controller, Delete, Get, Headers, MessageEvent, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Put, Query, RawBodyRequest, Req, Sse, UseGuards } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import { Observable, catchError, from, interval, map, of, startWith, switchMap } from "rxjs";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";
import { NotificationPreferenceDto } from "./dto/notification-preference.dto";
import { RegisterPushDeviceDto, UnregisterPushDeviceDto } from "./dto/push-device.dto";
import { WhatsAppWebhookService } from "./whatsapp-webhook.service";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query("unreadOnly", new ParseBoolPipe({ optional: true })) unreadOnly?: boolean,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.notifications.list(request.user.id, unreadOnly, limit);
  }

  @Patch("read-all")
  readAll(@Req() request: AuthenticatedRequest) {
    return this.notifications.markAllRead(request.user.id);
  }

  @Patch(":id/read")
  read(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.notifications.markRead(request.user.id, id);
  }

  @Get("preferences")
  preferences(@Req() request: AuthenticatedRequest) {
    return this.notifications.preferences(request.user.id);
  }

  @Put("preferences")
  updatePreference(@Req() request: AuthenticatedRequest, @Body() input: NotificationPreferenceDto) {
    return this.notifications.updatePreference(request.user.id, input);
  }

  @Post("devices")
  registerDevice(
    @Req() request: AuthenticatedRequest,
    @Body() input: RegisterPushDeviceDto,
  ) {
    return this.notifications.registerDevice(request.user.id, input);
  }

  @Delete("devices")
  unregisterDevice(
    @Req() request: AuthenticatedRequest,
    @Body() input: UnregisterPushDeviceDto,
  ) {
    return this.notifications.unregisterDevice(request.user.id, input.token);
  }

  @Sse("stream")
  stream(@Req() request: AuthenticatedRequest): Observable<MessageEvent> {
    return interval(15_000).pipe(
      startWith(0),
      switchMap(() => from(this.notifications.list(request.user.id, true, 20))),
      map((payload) => ({ type: "notifications", data: payload })),
      catchError(() => of({ type: "heartbeat", data: { available: false } })),
    );
  }
}

@ApiTags("WhatsApp webhooks")
@Controller("notifications/whatsapp/webhooks")
export class WhatsAppWebhooksController {
  constructor(private readonly webhooks: WhatsAppWebhookService) {}

  @Post()
  @SkipThrottle()
  receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers("x-bnc-whatsapp-signature") signature: string | undefined,
    @Headers("x-bnc-whatsapp-event-id") eventId: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    if (!request.rawBody) throw new Error("Raw WhatsApp webhook body is unavailable.");
    return this.webhooks.receive(signature, eventId, request.rawBody, payload);
  }
}
