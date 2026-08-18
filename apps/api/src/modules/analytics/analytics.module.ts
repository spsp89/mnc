import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/auth/roles.guard";
import { AuthModule } from "../auth/auth.module";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RolesGuard],
})
export class AnalyticsModule {}
