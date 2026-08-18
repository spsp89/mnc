import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "../../common/auth/jwt-auth.guard";
import { CompleteMediaUploadDto } from "./dto/complete-media-upload.dto";
import { CreateMediaDownloadDto } from "./dto/create-media-download.dto";
import { CreateMediaUploadDto } from "./dto/create-media-upload.dto";
import { MediaService } from "./media.service";

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("uploads")
  @ApiOperation({ summary: "Create a short-lived, checksum-bound S3 upload URL" })
  createUpload(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateMediaUploadDto,
  ) {
    return this.media.createUpload(request.user.id, input, request.user.role);
  }

  @Post("uploads/complete")
  @ApiOperation({ summary: "Verify an S3 upload before its object key is attached to a record" })
  completeUpload(
    @Req() request: AuthenticatedRequest,
    @Body() input: CompleteMediaUploadDto,
  ) {
    return this.media.completeUpload(request.user.id, input, request.user.role);
  }

  @Post("downloads")
  @ApiOperation({ summary: "Create a short-lived URL for an authorised private object" })
  createDownload(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateMediaDownloadDto,
  ) {
    return this.media.createDownload(
      request.user.id,
      request.user.role,
      input,
    );
  }
}
