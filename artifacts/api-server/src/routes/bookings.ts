import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  db,
  bookingsTable,
  servicesTable,
  staffTable,
  providersTable,
  usersTable,
} from "@workspace/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { emitSlotUpdate, emitBookingConfirmed } from "../lib/socket";

const router = Router();

const createBookingSchema = z.object({
  providerSlug: z.string(),
  serviceId: z.string(),
  staffId: z.string().optional(),
  startDatetime: z.string().datetime(),
});

router.post("/", requireAuth, async (req, res) => {
  const parse = createBookingSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() });
    return;
  }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.sub) });
  if (!user?.phoneVerified) {
    res.status(403).json({ code: "ERR-003", message: "Téléphone non vérifié. Vérifiez votre numéro avant de réserver." });
    return;
  }

  const provider = await db.query.providersTable.findFirst({ where: eq(providersTable.slug, parse.data.providerSlug) });
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const service = await db.query.servicesTable.findFirst({
    where: and(eq(servicesTable.id, parse.data.serviceId), eq(servicesTable.providerId, provider.id)),
  });
  if (!service || !service.isActive) { res.status(404).json({ code: "ERR-004", message: "Prestation introuvable" }); return; }

  const startDatetime = new Date(parse.data.startDatetime);
  const endDatetime = new Date(startDatetime.getTime() + service.durationMinutes * 60_000);

  let staffId = parse.data.staffId;
  if (!staffId) {
    const availableStaff = await db.query.staffTable.findFirst({
      where: and(eq(staffTable.providerId, provider.id), eq(staffTable.isActive, true)),
    });
    if (!availableStaff) { res.status(409).json({ code: "ERR-005", message: "Aucun staff disponible" }); return; }
    staffId = availableStaff.id;
  }

  const existingStaff = await db.query.staffTable.findFirst({
    where: and(eq(staffTable.id, staffId), eq(staffTable.providerId, provider.id)),
  });
  if (!existingStaff) { res.status(404).json({ code: "ERR-004", message: "Staff introuvable" }); return; }

  const overlap = await db.execute(sql`
    SELECT id FROM bookings
    WHERE staff_id = ${staffId}
      AND status NOT IN ('CANCELLED', 'EXPIRED')
      AND tstzrange(start_datetime, end_datetime) && tstzrange(${startDatetime.toISOString()}::timestamptz, ${endDatetime.toISOString()}::timestamptz)
    LIMIT 1
  `);

  if ((overlap.rows as unknown[]).length > 0) {
    res.status(409).json({ code: "ERR-005", message: "Ce créneau est déjà réservé" });
    return;
  }

  const lockedUntil = new Date(Date.now() + 10 * 60_000);
  const bookingId = uuidv4();

  await db.insert(bookingsTable).values({
    id: bookingId,
    providerId: provider.id,
    serviceId: service.id,
    staffId,
    clientId: req.user!.sub,
    startDatetime,
    endDatetime,
    status: "PENDING",
    lockedUntil,
    amountCents: service.priceCents,
    paymentStatus: "pending",
    paymentIntentId: `pi_mock_${bookingId}`,
  });

  emitSlotUpdate(provider.id, {
    slotStart: startDatetime.toISOString(),
    staffId,
    change: "booked",
  });

  res.status(201).json({
    bookingId,
    status: "PENDING",
    paymentIntentSecret: `pi_mock_${bookingId}_secret`,
    expiresAt: lockedUntil.toISOString(),
    amountCents: service.priceCents,
  });
});

router.post("/:bookingId/cancel", requireAuth, async (req, res) => {
  const booking = await db.query.bookingsTable.findFirst({
    where: and(eq(bookingsTable.id, req.params.bookingId), eq(bookingsTable.clientId, req.user!.sub)),
  });
  if (!booking) { res.status(404).json({ code: "ERR-004", message: "Réservation introuvable" }); return; }
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    res.status(409).json({ code: "ERR-005", message: "Réservation déjà annulée" }); return;
  }

  await db
    .update(bookingsTable)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(bookingsTable.id, req.params.bookingId));

  emitSlotUpdate(booking.providerId, {
    slotStart: booking.startDatetime.toISOString(),
    staffId: booking.staffId,
    change: "released",
  });

  res.json({ message: "Réservation annulée" });
});

router.post("/:bookingId/confirm", async (req, res) => {
  const booking = await db.query.bookingsTable.findFirst({ where: eq(bookingsTable.id, req.params.bookingId) });
  if (!booking) { res.status(404).json({ code: "ERR-004", message: "Réservation introuvable" }); return; }

  await db
    .update(bookingsTable)
    .set({ status: "CONFIRMED", paymentStatus: "paid", updatedAt: new Date() })
    .where(eq(bookingsTable.id, req.params.bookingId));

  const [service, staff, client] = await Promise.all([
    db.query.servicesTable.findFirst({ where: eq(servicesTable.id, booking.serviceId) }),
    db.query.staffTable.findFirst({ where: eq(staffTable.id, booking.staffId) }),
    db.query.usersTable.findFirst({ where: eq(usersTable.id, booking.clientId) }),
  ]);

  emitBookingConfirmed(booking.providerId, {
    bookingId: booking.id,
    staffId: booking.staffId,
    serviceName: service?.name ?? "",
    clientName: client?.name ?? "",
    startDatetime: booking.startDatetime.toISOString(),
  });

  res.json({ message: "Réservation confirmée" });
});

export default router;
