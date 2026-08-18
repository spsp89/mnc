require("reflect-metadata");

const { ActiveIdentityService } = require("../dist/common/auth/active-identity.service.js");

describe("ActiveIdentityService", () => {
  it("loads current roles from an active, unrevoked session", async () => {
    const prisma = {
      refreshSession: {
        findFirst: jest.fn().mockResolvedValue({
          user: {
            id: "user-1",
            role: "BUSINESS_OWNER",
            roleAssignments: [{ role: "VERIFICATION" }, { role: "VERIFICATION" }],
          },
        }),
      },
    };
    const service = new ActiveIdentityService(prisma);

    await expect(service.require("user-1", "session-1")).resolves.toEqual({
      id: "user-1",
      role: "BUSINESS_OWNER",
      roles: ["BUSINESS_OWNER", "VERIFICATION"],
    });
    expect(prisma.refreshSession.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "session-1",
        userId: "user-1",
        revokedAt: null,
        user: { status: "ACTIVE", deletedAt: null },
      }),
    }));
  });

  it("rejects legacy tokens without a session binding", async () => {
    const service = new ActiveIdentityService({ refreshSession: { findFirst: jest.fn() } });
    await expect(service.require("user-1", undefined)).rejects.toThrow("Sign in again");
  });

  it("rejects revoked, expired, suspended, or deleted identities", async () => {
    const service = new ActiveIdentityService({
      refreshSession: { findFirst: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.require("user-1", "session-1")).rejects.toThrow("no longer active");
  });
});
