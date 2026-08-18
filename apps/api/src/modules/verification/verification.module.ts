import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/auth/roles.guard";
import { AuthModule } from "../auth/auth.module";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  imports: [AuthModule],
  controllers: [VerificationController],
  providers: [VerificationService, RolesGuard],
})
export class VerificationModule {}
