require("reflect-metadata");

const { AuthService } = require("../dist/modules/auth/auth.service.js");

describe("AuthService email registration", () => {
  it("hashes the password and queues an expiring email challenge", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "user-1" });
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert,
      },
    };
    const config = {
      getOrThrow: jest.fn((name) => {
        if (name === "OTP_HASH_SECRET") return "email-test-secret-with-enough-entropy";
        throw new Error(`Unexpected config ${name}`);
      }),
      get: jest.fn((name) => name === "NODE_ENV" ? "development" : undefined),
    };
    const redis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue("OK"),
      lpush: jest.fn().mockResolvedValue(1),
    };
    const service = new AuthService(prisma, config, {}, {}, redis);

    const result = await service.registerEmail({
      email: " User@Example.com ",
      password: "correct-horse-battery-staple",
      displayName: "Test User",
    }, "127.0.0.1");

    const data = upsert.mock.calls[0][0].create;
    expect(data.email).toBe("user@example.com");
    expect(data.passwordHash).not.toContain("correct-horse");
    expect(data.passwordHash).toMatch(/^\$argon2/);
    expect(redis.set).toHaveBeenCalledWith(
      "email:verify:user@example.com",
      expect.any(String),
      "EX",
      600,
    );
    expect(redis.lpush).toHaveBeenCalledWith("notifications:email", expect.stringContaining("verify-email"));
    expect(result.data.developmentCode).toMatch(/^[0-9]{6}$/);
  });

  it("resets a password through an expiring challenge and revokes active sessions", async () => {
    const values = new Map();
    const redis = {
      incr: jest.fn().mockResolvedValue(1), expire: jest.fn().mockResolvedValue(1),
      set: jest.fn(async (key, value) => { values.set(key, value); return "OK"; }),
      get: jest.fn(async (key) => values.get(key) ?? null),
      del: jest.fn(async (key) => values.delete(key)), lpush: jest.fn().mockResolvedValue(1),
    };
    const update = jest.fn().mockResolvedValue({ id: "user-1" });
    const updateMany = jest.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: "user-1" }), update },
      refreshSession: { updateMany },
      $transaction: jest.fn(async (operations) => Promise.all(operations)),
    };
    const config = {
      getOrThrow: jest.fn(() => "email-test-secret-with-enough-entropy"),
      get: jest.fn((name) => name === "NODE_ENV" ? "development" : undefined),
    };
    const service = new AuthService(prisma, config, {}, {}, redis);
    const requested = await service.requestPasswordReset({ email: "User@Example.com" }, "127.0.0.1");
    await expect(service.resetPassword({
      email: "user@example.com",
      code: requested.data.developmentCode,
      newPassword: "new-correct-horse-battery-staple",
    })).resolves.toEqual({ data: { reset: true } });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { passwordHash: expect.stringMatching(/^\$argon2/) } }));
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1", revokedAt: null } }));
  });
});
