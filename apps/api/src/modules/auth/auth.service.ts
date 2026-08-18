import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash as argonHash, verify as argonVerify } from "argon2";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type Redis from "ioredis";
import { PrismaService } from "../../database/prisma.service";
import { REDIS } from "../../infrastructure/redis.module";
import type { RequestOtpDto } from "./dto/request-otp.dto";
import type { VerifyOtpDto } from "./dto/verify-otp.dto";
import type { RefreshSessionDto } from "./dto/refresh-session.dto";
import type { EmailLoginDto } from "./dto/email-login.dto";
import type { EmailRegisterDto } from "./dto/email-register.dto";
import type { EmailVerifyDto } from "./dto/email-verify.dto";
import type { GoogleSignInDto } from "./dto/google-sign-in.dto";
import type { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import { BusinessAccessService } from "../../common/auth/business-access.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly businessAccess: BusinessAccessService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  private normalisePhone(value: string) {
    const digits = value.replace(/\D/g, "");
    return digits.length === 10 ? `+91${digits}` : `+${digits}`;
  }

  private otpDigest(phone: string, purpose: string, code: string) {
    return createHmac("sha256", this.config.getOrThrow<string>("OTP_HASH_SECRET"))
      .update(`${phone}:${purpose}:${code}`)
      .digest("hex");
  }

  private emailDigest(email: string, code: string) {
    return createHmac("sha256", this.config.getOrThrow<string>("OTP_HASH_SECRET"))
      .update(`${email}:email-verification:${code}`)
      .digest("hex");
  }

  private passwordResetDigest(email: string, code: string) {
    return createHmac("sha256", this.config.getOrThrow<string>("OTP_HASH_SECRET"))
      .update(`${email}:password-reset:${code}`)
      .digest("hex");
  }

  private fixedTestOtpEnabled() {
    return this.config.get<boolean>("TEST_FIXED_OTP_ENABLED") === true;
  }

  async requestOtp(input: RequestOtpDto, ipAddress: string) {
    const phone = this.normalisePhone(input.phone);
    const rateKey = `otp:rate:${phone}:${input.purpose}`;
    const ipRateKey = `otp:ip:${ipAddress}`;
    const [phoneAttempts, ipAttempts] = await Promise.all([
      this.redis.incr(rateKey),
      this.redis.incr(ipRateKey),
    ]);
    if (phoneAttempts === 1) await this.redis.expire(rateKey, 15 * 60);
    if (ipAttempts === 1) await this.redis.expire(ipRateKey, 15 * 60);
    if (phoneAttempts > 5 || ipAttempts > 20) {
      throw new HttpException(
        "Too many OTP requests. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const fixedTestOtp = this.fixedTestOtpEnabled();
    const code = fixedTestOtp ? "123456" : String(randomInt(100000, 1000000));
    const otpKey = `otp:challenge:${phone}:${input.purpose}`;
    await this.redis.set(otpKey, this.otpDigest(phone, input.purpose, code), "EX", 5 * 60);

    if (!fixedTestOtp) {
      // Notification provider adapters consume this record outside fixed-code testing.
      await this.redis.lpush(
        "notifications:otp",
        JSON.stringify({ phone, purpose: input.purpose, code, createdAt: new Date().toISOString() }),
      );
    }

    return {
      data: {
        challengeExpiresInSeconds: 300,
        retryAfterSeconds: 30,
        ...(fixedTestOtp || this.config.get("NODE_ENV") === "development" ? { developmentCode: code } : {}),
        testingOnly: fixedTestOtp,
      },
    };
  }

  async verifyOtp(input: VerifyOtpDto, device: { ipAddress: string; userAgent?: string }) {
    const phone = this.normalisePhone(input.phone);
    const otpKey = `otp:challenge:${phone}:${input.purpose}`;
    const storedDigest = await this.redis.get(otpKey);
    if (!storedDigest) throw new BadRequestException("OTP expired or not requested.");

    const suppliedDigest = this.otpDigest(phone, input.purpose, input.code);
    const valid = timingSafeEqual(Buffer.from(storedDigest), Buffer.from(suppliedDigest));
    if (!valid) {
      const attempts = await this.redis.incr(`${otpKey}:attempts`);
      await this.redis.expire(`${otpKey}:attempts`, 5 * 60);
      if (attempts >= 5) await this.redis.del(otpKey);
      throw new UnauthorizedException("Incorrect OTP.");
    }
    await this.redis.del(otpKey, `${otpKey}:attempts`);

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: {
        phone,
        phoneVerifiedAt: new Date(),
        status: "ACTIVE",
        customerProfile: { create: {} },
      },
      update: {
        phoneVerifiedAt: new Date(),
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
      select: { id: true, phone: true, email: true, role: true, preferredLanguage: true },
    });

    return this.createSession(user.id, device);
  }

  async registerEmail(input: EmailRegisterDto, ipAddress: string) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true } });
    if (existing?.emailVerifiedAt) throw new ConflictException("An account with this email already exists.");
    const passwordHash = await argonHash(input.password, { type: 2 });
    await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        status: "PENDING",
        customerProfile: { create: { displayName: input.displayName } },
      },
      update: {
        passwordHash,
        status: "PENDING",
        customerProfile: {
          upsert: { create: { displayName: input.displayName }, update: { displayName: input.displayName } },
        },
      },
    });
    const rateKey = `email:verify:rate:${email}:${ipAddress}`;
    const attempts = await this.redis.incr(rateKey);
    if (attempts === 1) await this.redis.expire(rateKey, 15 * 60);
    if (attempts > 5) throw new HttpException("Too many verification requests.", HttpStatus.TOO_MANY_REQUESTS);
    const code = String(randomInt(100000, 1000000));
    await this.redis.set(`email:verify:${email}`, this.emailDigest(email, code), "EX", 10 * 60);
    await this.redis.lpush("notifications:email", JSON.stringify({
      template: "verify-email", email, code, createdAt: new Date().toISOString(),
    }));
    return {
      data: {
        verificationExpiresInSeconds: 600,
        ...(this.config.get("NODE_ENV") === "development" ? { developmentCode: code } : {}),
      },
    };
  }

  async verifyEmail(input: EmailVerifyDto, device: { ipAddress: string; userAgent?: string }) {
    const email = input.email.trim().toLowerCase();
    const key = `email:verify:${email}`;
    const storedDigest = await this.redis.get(key);
    if (!storedDigest) throw new BadRequestException("Email code expired or not requested.");
    const suppliedDigest = this.emailDigest(email, input.code);
    if (!timingSafeEqual(Buffer.from(storedDigest), Buffer.from(suppliedDigest))) {
      throw new UnauthorizedException("Incorrect email verification code.");
    }
    await this.redis.del(key);
    const user = await this.prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date(), status: "ACTIVE", lastLoginAt: new Date() },
      select: { id: true, phone: true, email: true, role: true, preferredLanguage: true },
    });
    return this.createSession(user.id, device);
  }

  async loginEmail(input: EmailLoginDto, device: { ipAddress: string; userAgent?: string }) {
    const email = input.email.trim().toLowerCase();
    const account = await this.prisma.user.findFirst({
      where: { email, status: "ACTIVE", deletedAt: null, emailVerifiedAt: { not: null } },
      select: { id: true, phone: true, email: true, role: true, preferredLanguage: true, passwordHash: true },
    });
    if (!account?.passwordHash || !(await argonVerify(account.passwordHash, input.password))) {
      throw new UnauthorizedException("Email or password is incorrect.");
    }
    await this.prisma.user.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
    return this.createSession(account.id, device);
  }

  async requestPasswordReset(input: RequestPasswordResetDto, ipAddress: string) {
    const email = input.email.trim().toLowerCase();
    const rateKey = `password:reset:rate:${email}:${ipAddress}`;
    const attempts = await this.redis.incr(rateKey);
    if (attempts === 1) await this.redis.expire(rateKey, 15 * 60);
    if (attempts > 5) {
      throw new HttpException("Too many password reset requests.", HttpStatus.TOO_MANY_REQUESTS);
    }
    const account = await this.prisma.user.findFirst({
      where: { email, emailVerifiedAt: { not: null }, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    let developmentCode: string | undefined;
    if (account) {
      const code = String(randomInt(100000, 1000000));
      await this.redis.set(`password:reset:${email}`, this.passwordResetDigest(email, code), "EX", 10 * 60);
      await this.redis.lpush("notifications:email", JSON.stringify({
        template: "reset-password", email, code, createdAt: new Date().toISOString(),
      }));
      if (this.config.get("NODE_ENV") === "development") developmentCode = code;
    }
    return {
      data: {
        accepted: true,
        challengeExpiresInSeconds: 600,
        ...(developmentCode ? { developmentCode } : {}),
      },
    };
  }

  async resetPassword(input: ResetPasswordDto) {
    const email = input.email.trim().toLowerCase();
    const key = `password:reset:${email}`;
    const storedDigest = await this.redis.get(key);
    if (!storedDigest) throw new BadRequestException("Password reset code is invalid or expired.");
    const suppliedDigest = this.passwordResetDigest(email, input.code);
    if (!timingSafeEqual(Buffer.from(storedDigest), Buffer.from(suppliedDigest))) {
      throw new UnauthorizedException("Password reset code is invalid or expired.");
    }
    const account = await this.prisma.user.findFirst({
      where: { email, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!account) throw new BadRequestException("Password reset code is invalid or expired.");
    const passwordHash = await argonHash(input.newPassword, { type: 2 });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: account.id }, data: { passwordHash } }),
      this.prisma.refreshSession.updateMany({ where: { userId: account.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.redis.del(key);
    return { data: { reset: true } };
  }

  async googleSignIn(input: GoogleSignInDto, device: { ipAddress: string; userAgent?: string }) {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    if (!clientId) throw new BadRequestException("Google sign-in is not configured.");
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
    let payload: { email?: string; email_verified?: boolean; name?: string };
    try {
      const verified = await jwtVerify(input.credential, jwks, {
        audience: clientId,
        issuer: ["https://accounts.google.com", "accounts.google.com"],
      });
      const rawPayload: Record<string, unknown> = verified.payload;
      payload = {
        email: typeof rawPayload.email === "string" ? rawPayload.email : undefined,
        email_verified: rawPayload.email_verified === true,
        name: typeof rawPayload.name === "string" ? rawPayload.name : undefined,
      };
    } catch {
      throw new UnauthorizedException("Google credential is invalid.");
    }
    if (!payload.email || !payload.email_verified) throw new UnauthorizedException("Google email is not verified.");
    const email = payload.email.toLowerCase();
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
        customerProfile: { create: { displayName: payload.name } },
      },
      update: { emailVerifiedAt: new Date(), status: "ACTIVE", lastLoginAt: new Date() },
      select: { id: true, phone: true, email: true, role: true, preferredLanguage: true },
    });
    return this.createSession(user.id, device);
  }

  async me(userId: string) {
    return { data: await this.sessionUser(userId) };
  }

  private async sessionUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: "ACTIVE", deletedAt: null },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        preferredLanguage: true,
        customerProfile: {
          select: { displayName: true, avatarUrl: true, defaultCity: true },
        },
        roleAssignments: {
          where: { active: true, revokedAt: null },
          select: { role: true },
        },
        businessOwner: {
          select: {
            businesses: {
              where: { deletedAt: null },
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
        businessMemberships: {
          where: { active: true, business: { deletedAt: null } },
          select: {
            business: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException("User account is not active.");

    const roles = [...new Set([
      user.role,
      ...user.roleAssignments.map((assignment) => assignment.role),
    ])];
    const businessRecords = new Map(
      [
        ...(user.businessOwner?.businesses ?? []),
        ...user.businessMemberships.map((membership) => membership.business),
      ].map((business) => [business.id, business]),
    );
    const businesses = await Promise.all(
      [...businessRecords.values()].map(async (business) => {
        const access = await this.businessAccess.accessFor(user.id, business.id);
        return {
          ...business,
          accessRole: access?.role ?? "VIEWER",
          capabilities: access?.capabilities ?? [],
        };
      }),
    );
    const admin = roles.some((role) => !["CUSTOMER", "BUSINESS_OWNER"].includes(role));

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      roles,
      preferredLanguage: user.preferredLanguage,
      profile: user.customerProfile,
      capabilities: {
        customer: true,
        business: businesses.length > 0,
        admin,
      },
      businesses,
    };
  }

  private async createSession(
    userId: string,
    device: { ipAddress: string; userAgent?: string },
  ) {
    const user = await this.sessionUser(userId);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: "refresh", nonce: crypto.randomUUID() },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "30d",
      },
    );
    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: await argonHash(refreshToken),
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, roles: user.roles, type: "access", sid: session.id },
      { expiresIn: "15m" },
    );

    return {
      data: {
        user,
        accessToken,
        refreshToken,
        accessTokenExpiresInSeconds: 900,
      },
    };
  }

  async refresh(input: RefreshSessionDto, device: { ipAddress: string; userAgent?: string }) {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(input.refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }
    if (payload.type !== "refresh") throw new UnauthorizedException("Invalid token type.");
    const sessions = await this.prisma.refreshSession.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    let matched: (typeof sessions)[number] | undefined;
    for (const session of sessions) {
      if (await argonVerify(session.tokenHash, input.refreshToken)) {
        matched = session;
        break;
      }
    }
    if (!matched) {
      await this.prisma.refreshSession.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse was detected. Sign in again.");
    }
    const user = await this.sessionUser(payload.sub);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: "refresh", nonce: crypto.randomUUID() },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "30d",
      },
    );
    const tokenHash = await argonHash(refreshToken);
    const [, newSession] = await this.prisma.$transaction([
      this.prisma.refreshSession.update({
        where: { id: matched.id },
        data: { revokedAt: new Date(), lastUsedAt: new Date() },
      }),
      this.prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash,
          ipAddress: device.ipAddress,
          userAgent: device.userAgent,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        select: { id: true },
      }),
    ]);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, roles: user.roles, type: "access", sid: newSession.id },
      { expiresIn: "15m" },
    );
    return {
      data: {
        user,
        accessToken,
        refreshToken,
        accessTokenExpiresInSeconds: 900,
      },
    };
  }

  async logout(input: RefreshSessionDto) {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(input.refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        ignoreExpiration: true,
      });
    } catch {
      return { data: { revoked: true } };
    }
    const sessions = await this.prisma.refreshSession.findMany({
      where: { userId: payload.sub, revokedAt: null },
      take: 20,
    });
    for (const session of sessions) {
      if (await argonVerify(session.tokenHash, input.refreshToken)) {
        await this.prisma.refreshSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
    return { data: { revoked: true } };
  }
}
