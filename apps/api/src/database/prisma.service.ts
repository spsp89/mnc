import { PrismaPg } from "@prisma/adapter-pg";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PoolConfig } from "pg";
import { PrismaClient } from "../generated/prisma/client";

type DatabaseConfigReader = Pick<ConfigService, "get" | "getOrThrow">;

export function databasePoolConfig(config: DatabaseConfigReader): PoolConfig {
  const timeoutMs = config.get<number>("DATABASE_QUERY_TIMEOUT_MS") ?? 5_000;
  return {
    connectionString: config.getOrThrow<string>("DATABASE_URL"),
    application_name: "bnc-api",
    connectionTimeoutMillis: timeoutMs,
    query_timeout: timeoutMs,
    statement_timeout: timeoutMs,
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy
{
  constructor(config: ConfigService) {
    const adapter = new PrismaPg(databasePoolConfig(config));
    super({
      adapter,
      log: config.get("NODE_ENV") === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
