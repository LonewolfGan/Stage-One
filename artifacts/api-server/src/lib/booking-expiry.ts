import { db, bookingsTable } from "@workspace/db";
import { and, eq, lt } from "drizzle-orm";
import { logger } from "./logger";
import { emitSlotUpdate } from "./socket";
import { redis } from "./redis";

async function expireBookings() {
  try {
    const now = new Date();
    const expired = await db
      .update(bookingsTable)
      .set({ status: "EXPIRED", updatedAt: now })
      .where(and(eq(bookingsTable.status, "PENDING"), lt(bookingsTable.lockedUntil, now)))
      .returning({
        id: bookingsTable.id,
        providerId: bookingsTable.providerId,
        staffId: bookingsTable.staffId,
        startDatetime: bookingsTable.startDatetime,
      });

    for (const b of expired) {
      logger.info({ bookingId: b.id }, "Booking expired — slot released");
      emitSlotUpdate(b.providerId, {
        slotStart: b.startDatetime.toISOString(),
        staffId: b.staffId,
        change: "released",
      });
    }
  } catch (err) {
    logger.error({ err }, "Booking expiry job failed");
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export async function startBookingExpiryJob() {
  if (redis) {
    try {
      const { Queue, Worker } = await import("bullmq");

      new Worker("booking-expiry", expireBookings, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection: redis as any,
        removeOnComplete: { count: 0 },
        removeOnFail: { count: 10 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queue = new Queue("booking-expiry", { connection: redis as any });
      // Remove old repeatable jobs to avoid duplicates on restart
      const repeatable = await queue.getRepeatableJobs();
      for (const job of repeatable) {
        await queue.removeRepeatableByKey(job.key);
      }
      await queue.add("check", {}, { repeat: { every: 60_000 } });

      logger.info("Booking expiry job started (BullMQ + Redis)");
      return;
    } catch (err) {
      logger.warn({ err }, "BullMQ failed to start — falling back to setInterval");
    }
  }

  // setInterval fallback when Redis is not configured
  if (intervalId) return;
  await expireBookings();
  intervalId = setInterval(expireBookings, 60_000);
  logger.info("Booking expiry job started (setInterval fallback — not production-safe)");
}

export function stopBookingExpiryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
