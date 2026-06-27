import { db } from "@workspace/db";
import { bookingsTable, servicesTable, staffTable } from "@workspace/db";
import { and, eq, lt, inArray } from "drizzle-orm";
import { logger } from "./logger";
import { emitSlotUpdate } from "./socket";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startBookingExpiryJob() {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      const now = new Date();
      const expired = await db
        .update(bookingsTable)
        .set({ status: "EXPIRED", updatedAt: now })
        .where(
          and(
            eq(bookingsTable.status, "PENDING"),
            lt(bookingsTable.lockedUntil, now),
          ),
        )
        .returning({
          id: bookingsTable.id,
          providerId: bookingsTable.providerId,
          staffId: bookingsTable.staffId,
          startDatetime: bookingsTable.startDatetime,
        });

      for (const b of expired) {
        logger.info({ bookingId: b.id }, "Booking expired, releasing slot");
        emitSlotUpdate(b.providerId, {
          slotStart: b.startDatetime.toISOString(),
          staffId: b.staffId,
          change: "released",
        });
      }
    } catch (err) {
      logger.error({ err }, "Booking expiry job failed");
    }
  }, 60_000);

  logger.info("Booking expiry job started (interval: 60s)");
}

export function stopBookingExpiryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
