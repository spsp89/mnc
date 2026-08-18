import "dotenv/config";
import pg from "pg";
import Redis from "ioredis";

const database = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
  await database.connect();
  const result = await database.query("select current_database() as database, current_user as username");
  console.log(`PostgreSQL ready: ${result.rows[0].database} (${result.rows[0].username})`);
} catch (error) {
  console.error(`PostgreSQL unavailable: ${error.code ?? error.name}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await database.end().catch(() => undefined);
}

const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000, maxRetriesPerRequest: 0, retryStrategy: () => null });
try {
  await redis.connect();
  console.log(`Redis ready: ${await redis.ping()}`);
} catch (error) {
  console.error(`Redis unavailable: ${error.code ?? error.name}: ${error.message}`);
  process.exitCode = 1;
} finally {
  redis.disconnect();
}
