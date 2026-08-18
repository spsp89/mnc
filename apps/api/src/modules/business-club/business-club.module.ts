import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminBusinessClubController, BusinessClubController } from "./business-club.controller";
import { BusinessClubService } from "./business-club.service";

@Module({
  imports: [AuthModule],
  controllers: [BusinessClubController, AdminBusinessClubController],
  providers: [BusinessClubService],
})
export class BusinessClubModule {}
