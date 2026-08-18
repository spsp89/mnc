import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { BlockBusinessDto } from "./dto/block-business.dto";
import { ConsentDto } from "./dto/consent.dto";
import { RecordSearchHistoryDto } from "./dto/record-search-history.dto";
import { SavedAddressDto } from "./dto/saved-address.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users/me")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated user profile" })
  me(@Req() request: AuthenticatedRequest) {
    return this.users.me(request.user.id);
  }

  @Patch()
  @ApiOperation({ summary: "Update customer profile preferences" })
  update(@Req() request: AuthenticatedRequest, @Body() input: UpdateProfileDto) {
    return this.users.updateProfile(request.user.id, input);
  }

  @Get("saved-businesses")
  saved(@Req() request: AuthenticatedRequest) {
    return this.users.savedBusinesses(request.user.id);
  }

  @Post("saved-businesses/:businessId")
  save(@Req() request: AuthenticatedRequest, @Param("businessId") businessId: string) {
    return this.users.saveBusiness(request.user.id, businessId);
  }

  @Delete("saved-businesses/:businessId")
  unsave(@Req() request: AuthenticatedRequest, @Param("businessId") businessId: string) {
    return this.users.removeSavedBusiness(request.user.id, businessId);
  }

  @Get("search-history")
  history(@Req() request: AuthenticatedRequest, @Query("limit", new ParseIntPipe({ optional: true })) limit?: number) {
    return this.users.searchHistory(request.user.id, limit);
  }

  @Post("search-history")
  recordHistory(@Req() request: AuthenticatedRequest, @Body() input: RecordSearchHistoryDto) {
    return this.users.recordSearchHistory(request.user.id, input);
  }

  @Delete("search-history")
  clearHistory(@Req() request: AuthenticatedRequest) {
    return this.users.clearSearchHistory(request.user.id);
  }

  @Get("addresses")
  addresses(@Req() request: AuthenticatedRequest) {
    return this.users.addresses(request.user.id);
  }

  @Post("addresses")
  addAddress(@Req() request: AuthenticatedRequest, @Body() input: SavedAddressDto) {
    return this.users.addAddress(request.user.id, input);
  }

  @Patch("addresses/:addressId")
  updateAddress(
    @Req() request: AuthenticatedRequest,
    @Param("addressId") addressId: string,
    @Body() input: SavedAddressDto,
  ) {
    return this.users.updateAddress(request.user.id, addressId, input);
  }

  @Delete("addresses/:addressId")
  removeAddress(@Req() request: AuthenticatedRequest, @Param("addressId") addressId: string) {
    return this.users.removeAddress(request.user.id, addressId);
  }

  @Get("saved-products")
  savedProducts(@Req() request: AuthenticatedRequest) {
    return this.users.savedProducts(request.user.id);
  }

  @Post("saved-products/:productId")
  saveProduct(@Req() request: AuthenticatedRequest, @Param("productId") productId: string) {
    return this.users.saveProduct(request.user.id, productId);
  }

  @Delete("saved-products/:productId")
  removeSavedProduct(@Req() request: AuthenticatedRequest, @Param("productId") productId: string) {
    return this.users.removeSavedProduct(request.user.id, productId);
  }

  @Get("recent-businesses")
  recentBusinesses(@Req() request: AuthenticatedRequest) {
    return this.users.recentBusinesses(request.user.id);
  }

  @Post("recent-businesses/:businessId")
  recordBusinessView(@Req() request: AuthenticatedRequest, @Param("businessId") businessId: string) {
    return this.users.recordBusinessView(request.user.id, businessId);
  }

  @Get("blocked-businesses")
  blockedBusinesses(@Req() request: AuthenticatedRequest) {
    return this.users.blockedBusinesses(request.user.id);
  }

  @Post("blocked-businesses/:businessId")
  blockBusiness(
    @Req() request: AuthenticatedRequest,
    @Param("businessId") businessId: string,
    @Body() input: BlockBusinessDto,
  ) {
    return this.users.blockBusiness(request.user.id, businessId, input);
  }

  @Delete("blocked-businesses/:businessId")
  unblockBusiness(@Req() request: AuthenticatedRequest, @Param("businessId") businessId: string) {
    return this.users.unblockBusiness(request.user.id, businessId);
  }

  @Get("sessions")
  sessions(@Req() request: AuthenticatedRequest) {
    return this.users.sessions(request.user.id);
  }

  @Get("consents")
  consents(@Req() request: AuthenticatedRequest) {
    return this.users.consents(request.user.id);
  }

  @Post("consents")
  recordConsent(@Req() request: AuthenticatedRequest, @Body() input: ConsentDto) {
    return this.users.recordConsent(request.user.id, input);
  }

  @Get("export")
  exportData(@Req() request: AuthenticatedRequest) {
    return this.users.exportData(request.user.id);
  }

  @Delete()
  deleteAccount(@Req() request: AuthenticatedRequest) {
    return this.users.deleteAccount(request.user.id);
  }
}
