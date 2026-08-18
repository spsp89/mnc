const fs = require("node:fs");
const path = require("node:path");

describe("API throttling scope", () => {
  const sourceRoot = path.resolve(__dirname, "../src");
  const appModule = fs.readFileSync(path.join(sourceRoot, "app.module.ts"), "utf8");
  const authController = fs.readFileSync(
    path.join(sourceRoot, "modules/auth/auth.controller.ts"),
    "utf8",
  );

  it("does not register the OTP quota as a global throttler", () => {
    expect(appModule).toContain('{ name: "short", ttl: 60_000, limit: 100 }');
    expect(appModule).not.toMatch(/name:\s*["']otp["']/);
  });

  it("keeps stricter limits on sensitive authentication endpoints", () => {
    expect(authController).toMatch(
      /@Post\("otp\/request"\)\s*@Throttle\(\{ short: \{ limit: 20, ttl: 15 \* 60_000 \} \}\)/,
    );
    expect(authController).toMatch(
      /@Post\("email\/login"\)\s*@Throttle\(\{ short: \{ limit: 10, ttl: 60_000 \} \}\)/,
    );
    expect(authController).toMatch(
      /@Post\("password\/request-reset"\)\s*@Throttle\(\{ short: \{ limit: 10, ttl: 15 \* 60_000 \} \}\)/,
    );
  });
});
