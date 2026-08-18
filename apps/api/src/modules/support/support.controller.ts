import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "../../common/auth/jwt-auth.guard";
import {
  OptionalJwtAuthGuard,
  type OptionallyAuthenticatedRequest,
} from "../../common/auth/optional-jwt-auth.guard";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { SupportService } from "./support.service";

@ApiTags("support")
@Controller("support/tickets")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Create a customer support ticket" })
  create(
    @Req() request: OptionallyAuthenticatedRequest,
    @Body() input: CreateSupportTicketDto,
  ) {
    return this.support.create(request.user?.id, input);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List the authenticated customer's support tickets" })
  mine(@Req() request: AuthenticatedRequest) {
    return this.support.mine(request.user.id);
  }
}
