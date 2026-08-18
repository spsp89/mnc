import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Create an order using server-authoritative product prices" })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateOrderDto) {
    return this.orders.create(request.user.id, input);
  }

  @Get("me")
  mine(@Req() request: AuthenticatedRequest) {
    return this.orders.listForCustomer(request.user.id);
  }

  @Get("business")
  forBusiness(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.orders.listForBusiness(request.user.id, businessId);
  }

  @Get(":id")
  find(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.orders.find(request.user.id, id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel an eligible customer order" })
  cancel(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.orders.cancel(request.user.id, id);
  }

  @Post(":id/return")
  @ApiOperation({ summary: "Request a return within the eligible window" })
  requestReturn(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.orders.requestReturn(request.user.id, id);
  }

  @Patch(":id/status")
  updateStatus(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateOrderStatusDto) {
    return this.orders.updateStatus(request.user.id, id, input);
  }
}
