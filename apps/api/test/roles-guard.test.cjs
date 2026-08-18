require("reflect-metadata");

const { RolesGuard } = require("../dist/common/auth/roles.guard.js");

describe("RolesGuard", () => {
  function context(roles) {
    return {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => ({ user: { id: "user-1", role: roles[0], roles } }) }),
    };
  }

  it("allows an assigned administrator role", () => {
    const guard = new RolesGuard({ getAllAndOverride: jest.fn().mockReturnValue(["SUPER_ADMIN", "VERIFICATION"]) });
    expect(guard.canActivate(context(["VERIFICATION"]))).toBe(true);
  });

  it("denies a merchant identity on administrator endpoints", () => {
    const guard = new RolesGuard({ getAllAndOverride: jest.fn().mockReturnValue(["SUPER_ADMIN", "VERIFICATION"]) });
    expect(() => guard.canActivate(context(["BUSINESS_OWNER"]))).toThrow("cannot perform this action");
  });
});
