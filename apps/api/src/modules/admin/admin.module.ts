import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RolesGuard } from "../../common/auth/roles.guard";
import { ActiveIdentityService } from "../../common/auth/active-identity.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: { issuer: "bnc-api", audience: "bnc-clients" },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, ActiveIdentityService, JwtAuthGuard, RolesGuard],
})
export class AdminModule {}
