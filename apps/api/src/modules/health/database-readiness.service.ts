import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "pg";

export class DatabaseReadinessTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Database readiness probe exceeded ${timeoutMs} ms.`);
    this.name = "DatabaseReadinessTimeoutError";
  }
}

export function withDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new DatabaseReadinessTimeoutError(timeoutMs)),
      timeoutMs,
    );
    timer.unref?.();

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

@Injectable()
export class DatabaseReadinessService {
  constructor(private readonly config: ConfigService) {}

  async check(): Promise<void> {
    const timeoutMs = this.config.get<number>("HEALTH_READINESS_TIMEOUT_MS") ?? 3_000;
    const client = new Client({
      connectionString: this.config.getOrThrow<string>("DATABASE_URL"),
      application_name: "bnc-readiness",
      connectionTimeoutMillis: timeoutMs,
      query_timeout: timeoutMs,
      statement_timeout: timeoutMs,
    });

    try {
      await withDeadline(client.connect(), timeoutMs);
      await withDeadline(client.query("SELECT 1"), timeoutMs);
    } catch {
      throw new ServiceUnavailableException({
        message: "Database readiness check failed.",
        status: "not_ready",
        database: "unavailable",
        retryable: true,
        timestamp: new Date().toISOString(),
      });
    } finally {
      void client.end().catch(() => undefined);
    }
  }
}
