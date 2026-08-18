const { ServiceUnavailableException } = require("@nestjs/common");
const {
  DatabaseReadinessTimeoutError,
  withDeadline,
} = require("../dist/modules/health/database-readiness.service.js");
const {
  HealthController,
} = require("../dist/modules/health/health.controller.js");
const {
  databasePoolConfig,
  PrismaService,
} = require("../dist/database/prisma.service.js");

describe("health readiness", () => {
  it("bounds a database operation that never settles", async () => {
    jest.useFakeTimers();
    try {
      const result = withDeadline(new Promise(() => undefined), 500);
      jest.advanceTimersByTime(500);
      await expect(result).rejects.toBeInstanceOf(DatabaseReadinessTimeoutError);
    } finally {
      jest.useRealTimers();
    }
  });

  it("reports readiness only after the database probe succeeds", async () => {
    const check = jest.fn().mockResolvedValue(undefined);
    const controller = new HealthController({ check });

    await expect(controller.ready()).resolves.toEqual({
      data: expect.objectContaining({
        status: "ready",
        database: "connected",
      }),
    });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("preserves a service-unavailable database result", async () => {
    const failure = new ServiceUnavailableException({
      message: "Database readiness check failed.",
      status: "not_ready",
      database: "unavailable",
      retryable: true,
    });
    const controller = new HealthController({
      check: jest.fn().mockRejectedValue(failure),
    });

    await expect(controller.ready()).rejects.toBe(failure);
    expect(failure.getStatus()).toBe(503);
  });

  it("does not require a database connection before liveness can start", () => {
    expect(PrismaService.prototype.onModuleInit).toBeUndefined();
  });

  it("applies bounded connection, client-query and server-statement deadlines", () => {
    const config = databasePoolConfig({
      get: jest.fn().mockReturnValue(7_500),
      getOrThrow: jest.fn().mockReturnValue("postgresql://example.invalid/bnc"),
    });

    expect(config).toEqual(expect.objectContaining({
      connectionTimeoutMillis: 7_500,
      query_timeout: 7_500,
      statement_timeout: 7_500,
      application_name: "bnc-api",
    }));
  });
});
