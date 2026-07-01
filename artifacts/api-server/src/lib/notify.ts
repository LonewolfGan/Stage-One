/**
 * notify.ts — deep booking notification module
 *
 * Single interface for all side-effects that follow a booking status change:
 *   - Socket.io emit (real-time dashboard update)
 *   - DB notification row (owner bell icon)
 *   - Email job enqueueing (confirmation + J-1 reminder)
 *
 * Callers (routes, webhooks, workers) import from here only — not from
 * socket, email-worker, or notificationsTable directly.
 */

import { db, bookingsTable, servicesTable, staffTable, usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { emitBookingConfirmed, emitSlotUpdate } from "./socket";
import { enqueueEmailJob } from "./email-worker";
import { logger } from "./logger";

type BookingRow = typeof bookingsTable.$inferSelect;

interface NotifyCtx {
  service?: { name: string } | null;
  staff?:   { name: string } | null;
  client?:  { name: string } | null;
}

// ── Booking confirmed ───────────────────────────────────────────────────────
/**
 * Fire all confirmation side-effects for a booking:
 * socket emit → DB notification → confirmation email → J-1 reminder email.
 *
 * Pass pre-fetched `ctx` to avoid redundant DB queries when callers already
 * have the related rows (e.g. webhook handler).
 */
export async function notifyBookingConfirmed(
  booking: BookingRow,
  ctx?: NotifyCtx,
): Promise<void> {
  // Fetch any missing related rows in one round-trip
  const [service, staff, client] = await Promise.all([
    ctx?.service !== undefined
      ? Promise.resolve(ctx.service)
      : db.query.servicesTable.findFirst({ where: eq(servicesTable.id, booking.serviceId) }),
    ctx?.staff !== undefined
      ? Promise.resolve(ctx.staff)
      : db.query.staffTable.findFirst({ where: eq(staffTable.id, booking.staffId) }),
    ctx?.client !== undefined
      ? Promise.resolve(ctx.client)
      : db.query.usersTable.findFirst({ where: eq(usersTable.id, booking.clientId) }),
  ]);

  // 1. Real-time socket push
  emitBookingConfirmed(booking.providerId, {
    bookingId:     booking.id,
    staffId:       booking.staffId,
    serviceName:   service?.name ?? "",
    clientName:    client?.name ?? "",
    startDatetime: booking.startDatetime.toISOString(),
  });

  // 2. Persist notification row for owner dashboard bell
  const startFormatted = booking.startDatetime.toLocaleString("fr-MA", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
    hour:    "2-digit",
    minute:  "2-digit",
    timeZone: "Africa/Casablanca",
  });
  await db
    .insert(notificationsTable)
    .values({
      providerId: booking.providerId,
      type:       "booking.confirmed",
      title:      "Nouvelle réservation confirmée",
      body:       `${client?.name ?? "Client"} — ${service?.name ?? "Prestation"} à ${startFormatted}`,
      metadata: {
        bookingId:    booking.id,
        staffId:      booking.staffId,
        staffName:    staff?.name ?? null,
        serviceName:  service?.name ?? null,
        clientName:   client?.name ?? null,
        startDatetime: booking.startDatetime.toISOString(),
      },
    })
    .catch((err) => logger.error({ err }, "Failed to persist booking notification"));

  // 3. Confirmation email (immediate)
  enqueueEmailJob({ type: "booking_confirmation", bookingId: booking.id }).catch((err) =>
    logger.error({ err }, "Failed to enqueue confirmation email"),
  );

  // 4. J-1 reminder (only when appointment is > 25h away)
  const msUntilStart  = booking.startDatetime.getTime() - Date.now();
  const reminderDelay = msUntilStart - 24 * 60 * 60 * 1_000;
  if (reminderDelay > 60_000) {
    enqueueEmailJob({ type: "booking_reminder", bookingId: booking.id }, reminderDelay).catch((err) =>
      logger.error({ err }, "Failed to enqueue reminder email"),
    );
  }
}

// ── Slot events ─────────────────────────────────────────────────────────────
/** Emit a "slot booked" socket event. */
export function notifySlotBooked(
  providerId: string,
  staffId:    string,
  startDatetime: Date,
): void {
  emitSlotUpdate(providerId, {
    slotStart: startDatetime.toISOString(),
    staffId,
    change: "booked",
  });
}

/** Emit a "slot released" socket event (cancellation or payment failure). */
export function notifySlotReleased(
  booking: Pick<BookingRow, "providerId" | "staffId" | "startDatetime">,
): void {
  emitSlotUpdate(booking.providerId, {
    slotStart: booking.startDatetime.toISOString(),
    staffId:   booking.staffId,
    change:    "released",
  });
}
