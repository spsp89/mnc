import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { OptionalJwtAuthGuard, type OptionallyAuthenticatedRequest } from "../../common/auth/optional-jwt-auth.guard";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { EnquiriesService } from "./enquiries.service";
import { MerchantEnquiryQueryDto, UpdateMerchantEnquiryStatusDto } from "./dto/merchant-enquiry.dto";

@ApiTags("enquiries")
@Controller("enquiries")
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Submit a consent-gated customer enquiry" })
  create(@Req() request: OptionallyAuthenticatedRequest, @Body() input: CreateEnquiryDto) {
    return this.enquiries.create(input, request.user?.id);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@Req() request: AuthenticatedRequest) {
    return this.enquiries.listForCustomer(request.user.id);
  }

  @Get("business")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  forBusiness(@Req() request: AuthenticatedRequest, @Query() query: MerchantEnquiryQueryDto) {
    return this.enquiries.listForBusiness(request.user.id, query);
  }

  @Get("business/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  merchantDetail(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Query("businessId") businessId: string) {
    return this.enquiries.merchantDetail(request.user.id, id, businessId);
  }

  @Patch("business/:id/status")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateMerchantStatus(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateMerchantEnquiryStatusDto) {
    return this.enquiries.updateMerchantStatus(request.user.id, id, input);
  }

  @Post(":id/close")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  close(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.enquiries.close(request.user.id, id);
  }
}
