import Redis from "ioredis";
import { logger } from "./logger";

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
  redis.on("error", (err) => logger.error({ err }, "Redis error"));
  redis.on("connect", () => logger.info("Redis connected"));
  redis.connect().catch((err) => logger.error({ err }, "Redis connect failed"));
} else {
  logger.warn("REDIS_URL not set — distributed slot locking is disabled");
}

export { redis };
