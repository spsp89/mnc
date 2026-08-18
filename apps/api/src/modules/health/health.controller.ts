import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DatabaseReadinessService } from "./database-readiness.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly databaseReadiness: DatabaseReadinessService) {}

  @Get()
  @ApiOperation({ summary: "Liveness check" })
  live() {
    return {
      data: {
        status: "healthy",
        service: "bnc-api",
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("ready")
  @ApiOperation({ summary: "Database readiness check" })
  async ready() {
    await this.databaseReadiness.check();
    return {
      data: {
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
