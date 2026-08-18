import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { BookingsService } from "./bookings.service";
import {
  CreateBookingProviderDto,
  CreateBookingScheduleDto,
  CreateBookingTimeOffDto,
  RescheduleBookingDto,
} from "./dto/booking-setup.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";

@ApiTags("booking availability")
@Controller("booking-availability")
export class BookingAvailabilityController {
  constructor(private readonly bookings: BookingsService) {}

  @Get("providers")
  providers(@Query("businessId") businessId: string, @Query("serviceId") serviceId: string) {
    return this.bookings.availabilityProviders(businessId, serviceId);
  }

  @Get("slots")
  slots(
    @Query("businessId") businessId: string,
    @Query("serviceId") serviceId: string,
    @Query("date") date: string,
    @Query("providerId") providerId?: string,
  ) {
    return this.bookings.availabilitySlots(businessId, serviceId, date, providerId);
  }
}

@ApiTags("bookings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get("mine")
  mine(@Req() request: AuthenticatedRequest) {
    return this.bookings.mine(request.user.id);
  }

  @Get("manage")
  manage(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.bookings.manage(request.user.id, businessId);
  }

  @Get("setup")
  setup(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.bookings.setup(request.user.id, businessId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateBookingDto) {
    return this.bookings.create(request.user.id, input);
  }

  @Post("providers")
  createProvider(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateBookingProviderDto,
  ) {
    return this.bookings.createProvider(request.user.id, input);
  }

  @Post("schedules")
  createSchedule(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateBookingScheduleDto,
  ) {
    return this.bookings.createSchedule(request.user.id, input);
  }

  @Delete("schedules/:id")
  deleteSchedule(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.bookings.deleteSchedule(request.user.id, id);
  }

  @Post("time-off")
  createTimeOff(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateBookingTimeOffDto,
  ) {
    return this.bookings.createTimeOff(request.user.id, input);
  }

  @Patch(":id")
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateBookingDto) {
    return this.bookings.update(request.user.id, id, input);
  }

  @Post(":id/cancel")
  cancel(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.bookings.cancel(request.user.id, id);
  }

  @Post(":id/reschedule")
  reschedule(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() input: RescheduleBookingDto,
  ) {
    return this.bookings.reschedule(request.user.id, id, input);
  }
}
