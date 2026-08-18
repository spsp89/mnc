import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { WeeklyDrawsController, AdminWeeklyDrawsController } from "./weekly-draws.controller";
import { WeeklyDrawsService } from "./weekly-draws.service";

@Module({
  imports: [AuthModule],
  controllers: [WeeklyDrawsController, AdminWeeklyDrawsController],
  providers: [WeeklyDrawsService],
})
export class WeeklyDrawsModule {}
