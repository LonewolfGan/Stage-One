/**
 * notify.ts — booking notification module
 *
 * Single interface for all side-effects that follow a booking status change:
 *   - Socket.io emit (real-time dashboard update)
 *   - DB notification row (owner bell icon)
 *   - Email job enqueueing (confirmation + J-1 reminder)
 *   - SMS via Twilio (confirmation to client)
 */

import { db, bookingsTable, servicesTable, staffTable, usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { emitBookingConfirmed, emitSlotUpdate } from "./socket";
import { enqueueEmailJob } from "./email-worker";
import { sendSms, formatDateFr } from "./sms";
import { logger } from "./logger";

type BookingRow = typeof bookingsTable.$inferSelect;

interface NotifyCtx {
  service?: { name: string } | null;
  staff?:   { name: string } | null;
  client?:  { name: string; phone?: string } | null;
}

// ── Booking confirmed ───────────────────────────────────────────────────────
export async function notifyBookingConfirmed(
  booking: BookingRow,
  ctx?: NotifyCtx,
): Promise<void> {
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

  // 4. J-1 reminder email (only when appointment is > 25h away)
  const msUntilStart  = booking.startDatetime.getTime() - Date.now();
  const reminderDelay = msUntilStart - 24 * 60 * 60 * 1_000;
  if (reminderDelay > 60_000) {
    enqueueEmailJob({ type: "booking_reminder", bookingId: booking.id }, reminderDelay).catch((err) =>
      logger.error({ err }, "Failed to enqueue reminder email"),
    );
  }

  // 5. SMS confirmation to client (fire-and-forget)
  if (client && "phone" in client && client.phone) {
    const dateStr = formatDateFr(booking.startDatetime);
    const smsBody = `✅ Réservation confirmée — ${service?.name ?? "Prestation"} le ${dateStr}. Merci de votre confiance !`;
    sendSms(client.phone, smsBody).catch((err) =>
      logger.error({ err }, "Failed to send SMS confirmation"),
    );
  }
}

// ── Slot events ─────────────────────────────────────────────────────────────
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

export function notifySlotReleased(
  booking: Pick<BookingRow, "providerId" | "staffId" | "startDatetime">,
): void {
  emitSlotUpdate(booking.providerId, {
    slotStart: booking.startDatetime.toISOString(),
    staffId:   booking.staffId,
    change:    "released",
  });
}
