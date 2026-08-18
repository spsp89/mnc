import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { OptionalJwtAuthGuard, type OptionallyAuthenticatedRequest } from "../../common/auth/optional-jwt-auth.guard";
import { ApplyJobDto } from "./dto/apply-job.dto";
import { CreateJobDto } from "./dto/create-job.dto";
import { ListJobsDto } from "./dto/list-jobs.dto";
import { UpdateJobApplicationDto } from "./dto/update-job-application.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JobsService } from "./jobs.service";

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@Query() query: ListJobsDto) {
    return this.jobs.list(query);
  }

  @Get("manage")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  manage(@Req() request: AuthenticatedRequest, @Query("businessId") businessId: string) {
    return this.jobs.manage(request.user.id, businessId);
  }

  @Get("applications/me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  myApplications(@Req() request: AuthenticatedRequest) {
    return this.jobs.myApplications(request.user.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateJobDto) {
    return this.jobs.create(request.user.id, input);
  }

  @Patch("applications/:applicationId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateApplication(
    @Req() request: AuthenticatedRequest,
    @Param("applicationId") applicationId: string,
    @Body() input: UpdateJobApplicationDto,
  ) {
    return this.jobs.updateApplication(request.user.id, applicationId, input);
  }

  @Get(":id")
  find(@Param("id") id: string) {
    return this.jobs.find(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() input: UpdateJobDto) {
    return this.jobs.update(request.user.id, id, input);
  }

  @Post(":id/publish")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  publish(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.jobs.publish(request.user.id, id);
  }

  @Post(":id/close")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  close(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.jobs.close(request.user.id, id);
  }

  @Post(":id/applications")
  @UseGuards(OptionalJwtAuthGuard)
  apply(@Req() request: OptionallyAuthenticatedRequest, @Param("id") id: string, @Body() input: ApplyJobDto) {
    return this.jobs.apply(id, input, request.user?.id);
  }

  @Get(":id/applications")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  applications(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.jobs.applications(request.user.id, id);
  }
}
