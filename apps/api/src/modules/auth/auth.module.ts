import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/auth/optional-jwt-auth.guard";
import { ActiveIdentityService } from "../../common/auth/active-identity.service";

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
  controllers: [AuthController],
  providers: [AuthService, ActiveIdentityService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, JwtModule, ActiveIdentityService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
