import { config as loadEnvironment } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const apiRoot = path.dirname(fileURLToPath(import.meta.url));
const explicitDirectDatabaseUrl = process.env.DIRECT_DATABASE_URL;
loadEnvironment({ path: path.resolve(apiRoot, "../../.env") });
loadEnvironment({ path: path.resolve(apiRoot, ".env"), override: true });
if (explicitDirectDatabaseUrl) process.env.DIRECT_DATABASE_URL = explicitDirectDatabaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_DATABASE_URL"),
  },
});
