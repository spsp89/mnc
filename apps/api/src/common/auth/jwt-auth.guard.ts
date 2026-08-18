import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { UserRole } from "../../generated/prisma/enums";
import { ActiveIdentityService } from "./active-identity.service";

export type AuthenticatedRequest = Request & {
  user: { id: string; role: UserRole; roles: UserRole[] };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly activeIdentity: ActiveIdentityService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("A valid access token is required.");
    }
    let payload: {
      sub: string;
      role: UserRole;
      roles?: UserRole[];
      type: string;
      sid?: string;
    };
    try {
      payload = await this.jwt.verifyAsync(authorization.slice(7));
    } catch {
      // JWT parser/signature/expiry errors are authentication failures, not
      // internal server errors. Keep the response stable and non-sensitive.
      throw new UnauthorizedException("Access token is invalid or expired.");
    }
    if (payload.type !== "access") throw new UnauthorizedException("Invalid token type.");
    request.user = await this.activeIdentity.require(payload.sub, payload.sid);
    return true;
  }
}
