require("reflect-metadata");

const { JwtAuthGuard } = require("../dist/common/auth/jwt-auth.guard.js");

describe("JwtAuthGuard", () => {
  function context(authorization) {
    const request = { headers: { authorization } };
    return {
      request,
      execution: {
        switchToHttp: () => ({ getRequest: () => request }),
      },
    };
  }

  it("normalizes malformed or expired JWT errors to an unauthorized response", async () => {
    const jwt = { verifyAsync: jest.fn().mockRejectedValue(new Error("jwt malformed")) };
    const guard = new JwtAuthGuard(jwt, { require: jest.fn() });
    const { execution } = context("Bearer invalid-token");

    await expect(guard.canActivate(execution)).rejects.toMatchObject({ status: 401 });
  });

  it("attaches a verified access identity to the request", async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: "user-1",
        role: "BUSINESS_OWNER",
        roles: ["BUSINESS_OWNER"],
        type: "access",
        sid: "session-1",
      }),
    };
    const activeIdentity = {
      require: jest.fn().mockResolvedValue({
        id: "user-1",
        role: "BUSINESS_OWNER",
        roles: ["BUSINESS_OWNER"],
      }),
    };
    const guard = new JwtAuthGuard(jwt, activeIdentity);
    const { execution, request } = context("Bearer valid-token");

    await expect(guard.canActivate(execution)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: "user-1",
      role: "BUSINESS_OWNER",
      roles: ["BUSINESS_OWNER"],
    });
    expect(activeIdentity.require).toHaveBeenCalledWith("user-1", "session-1");
  });

  it("rejects a token whose account, roles, or refresh session were revoked", async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: "user-1",
        role: "SUPER_ADMIN",
        roles: ["SUPER_ADMIN"],
        type: "access",
        sid: "revoked-session",
      }),
    };
    const activeIdentity = {
      require: jest.fn().mockRejectedValue(Object.assign(new Error("Access session is no longer active."), { status: 401 })),
    };
    const guard = new JwtAuthGuard(jwt, activeIdentity);
    const { execution } = context("Bearer revoked-token");

    await expect(guard.canActivate(execution)).rejects.toMatchObject({ status: 401 });
  });
});
