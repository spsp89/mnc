import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List active local marketplace products" })
  list(@Query() query: ListProductsDto) {
    return this.products.list(query);
  }

  @Get("manage")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List products visible in a managed business workspace" })
  manage(
    @Req() request: AuthenticatedRequest,
    @Query("businessId") businessId: string,
  ) {
    return this.products.manage(request.user.id, businessId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get public product detail" })
  find(@Param("id") id: string) {
    return this.products.find(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a product for an owned business" })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateProductDto) {
    return this.products.create(request.user.id, input);
  }

  @Post(":id/submit")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Submit a complete product draft for moderation" })
  submit(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.products.submit(request.user.id, id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateProductDto) {
    return this.products.update(request.user.id, id, input);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  archive(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.products.archive(request.user.id, id);
  }
}
