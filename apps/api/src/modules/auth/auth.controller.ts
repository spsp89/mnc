import { Body, Controller, Get, Headers, Ip, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { RefreshSessionDto } from "./dto/refresh-session.dto";
import { EmailLoginDto } from "./dto/email-login.dto";
import { EmailRegisterDto } from "./dto/email-register.dto";
import { EmailVerifyDto } from "./dto/email-verify.dto";
import { GoogleSignInDto } from "./dto/google-sign-in.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("otp/request")
  @Throttle({ short: { limit: 20, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: "Request a rate-limited mobile OTP" })
  requestOtp(@Body() input: RequestOtpDto, @Ip() ipAddress: string) {
    return this.auth.requestOtp(input, ipAddress);
  }

  @Post("otp/verify")
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Verify OTP and create an access/refresh session" })
  verifyOtp(
    @Body() input: VerifyOtpDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.auth.verifyOtp(input, { ipAddress, userAgent });
  }

  @Post("email/register")
  @Throttle({ short: { limit: 10, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: "Create an email account and send a verification challenge" })
  registerEmail(@Body() input: EmailRegisterDto, @Ip() ipAddress: string) {
    return this.auth.registerEmail(input, ipAddress);
  }

  @Post("email/verify")
  @Throttle({ short: { limit: 20, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: "Verify an email challenge and create a session" })
  verifyEmail(
    @Body() input: EmailVerifyDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.auth.verifyEmail(input, { ipAddress, userAgent });
  }

  @Post("email/login")
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Sign in with a verified email and password" })
  loginEmail(
    @Body() input: EmailLoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.auth.loginEmail(input, { ipAddress, userAgent });
  }

  @Post("password/request-reset")
  @Throttle({ short: { limit: 10, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: "Request a rate-limited email password reset challenge" })
  requestPasswordReset(@Body() input: RequestPasswordResetDto, @Ip() ipAddress: string) {
    return this.auth.requestPasswordReset(input, ipAddress);
  }

  @Post("password/reset")
  @Throttle({ short: { limit: 20, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: "Reset an email password and revoke existing sessions" })
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.auth.resetPassword(input);
  }

  @Post("google")
  @Throttle({ short: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: "Verify a Google OIDC credential and create a session" })
  google(
    @Body() input: GoogleSignInDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.auth.googleSignIn(input, { ipAddress, userAgent });
  }

  @Post("refresh")
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: "Rotate a valid refresh session" })
  refresh(
    @Body() input: RefreshSessionDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.auth.refresh(input, { ipAddress, userAgent });
  }

  @Post("logout")
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: "Revoke the current refresh session" })
  logout(@Body() input: RefreshSessionDto) {
    return this.auth.logout(input);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the active identity, global roles and business workspaces" })
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.me(request.user.id);
  }
}
