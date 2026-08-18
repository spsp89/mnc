import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "../../generated/prisma/enums";
import type { AuthenticatedRequest } from "./jwt-auth.guard";
import { ActiveIdentityService } from "./active-identity.service";

export type OptionallyAuthenticatedRequest = Omit<AuthenticatedRequest, "user"> & {
  user?: { id: string; role: UserRole; roles: UserRole[] };
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly activeIdentity: ActiveIdentityService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OptionallyAuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization) return true;
    if (!authorization.startsWith("Bearer ")) throw new UnauthorizedException("Invalid authorization header.");
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: UserRole; type: string; sid?: string }>(authorization.slice(7));
      if (payload.type !== "access") throw new UnauthorizedException("Invalid token type.");
      request.user = await this.activeIdentity.require(payload.sub, payload.sid);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token.");
    }
  }
}
