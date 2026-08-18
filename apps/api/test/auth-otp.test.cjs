require("reflect-metadata");

const { createHmac } = require("node:crypto");
const { AuthService } = require("../dist/modules/auth/auth.service.js");

describe("AuthService fixed testing OTP", () => {
  it("uses 123456 for every requested phone when the explicit test flag is enabled", async () => {
    const secret = "fixed-otp-test-secret-with-enough-entropy";
    const config = {
      getOrThrow: jest.fn((name) => {
        if (name === "OTP_HASH_SECRET") return secret;
        throw new Error(`Unexpected config ${name}`);
      }),
      get: jest.fn((name) => {
        if (name === "TEST_FIXED_OTP_ENABLED") return true;
        if (name === "NODE_ENV") return "production";
        return undefined;
      }),
    };
    const redis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue("OK"),
      lpush: jest.fn().mockResolvedValue(1),
    };
    const service = new AuthService({}, config, {}, {}, redis);

    const result = await service.requestOtp(
      { phone: "98765 43210", purpose: "login" },
      "127.0.0.1",
    );
    const digest = createHmac("sha256", secret)
      .update("+919876543210:login:123456")
      .digest("hex");

    expect(redis.set).toHaveBeenCalledWith(
      "otp:challenge:+919876543210:login",
      digest,
      "EX",
      300,
    );
    expect(redis.lpush).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: {
        challengeExpiresInSeconds: 300,
        retryAfterSeconds: 30,
        developmentCode: "123456",
        testingOnly: true,
      },
    });
  });
});
