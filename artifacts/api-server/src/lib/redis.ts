import Redis from "ioredis";
import { logger } from "./logger";

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    // Required by Upstash and BullMQ — BullMQ uses blocking commands
    maxRetriesPerRequest: null,
    // Upstash requires TLS even with redis:// scheme on port 6379
    tls: process.env.REDIS_URL.includes("upstash.io") ? {} : undefined,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
  redis.on("error", (err) => logger.error({ err }, "Redis error"));
  redis.on("connect", () => logger.info("Redis connected"));
  redis.on("ready", () => logger.info("Redis ready"));
  redis.connect().catch((err) => logger.error({ err }, "Redis connect failed"));
} else {
  logger.warn("REDIS_URL not set — distributed slot locking is disabled");
}

export { redis };
