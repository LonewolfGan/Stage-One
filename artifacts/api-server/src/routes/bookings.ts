import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, bookingsTable, servicesTable, staffTable, providersTable, usersTable, reviewsTable } from "@workspace/db";
import { eq, and, sql, desc, isNotNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { emitSlotUpdate, emitBookingConfirmed } from "../lib/socket";
import { stripe } from "../lib/stripe";
import { redis } from "../lib/redis";
import { enqueueEmailJob } from "../lib/email-worker";

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

  // Redis distributed lock (30s TTL) — prevents concurrent requests for the same slot
  const lockKey = `lock:staff:${staffId}:${startDatetime.toISOString()}`;
  if (redis) {
    const locked = await redis.set(lockKey, "1", "NX", "EX", 30);
    if (!locked) {
      res.status(409).json({ code: "ERR-005", message: "Ce créneau est en cours de réservation, réessayez dans quelques secondes." });
      return;
    }
  }

  const bookingId = uuidv4();
  const lockedUntil = new Date(Date.now() + 10 * 60_000);

  let booking: typeof bookingsTable.$inferSelect;
  try {
    booking = await db.transaction(async (tx) => {
      // SELECT FOR UPDATE — serialise concurrent requests at the DB level
      const conflicts = await tx.execute(sql`
        SELECT id FROM bookings
        WHERE staff_id = ${staffId}
          AND status NOT IN ('CANCELLED', 'EXPIRED')
          AND tstzrange(start_datetime, end_datetime) &&
              tstzrange(${startDatetime.toISOString()}::timestamptz, ${endDatetime.toISOString()}::timestamptz)
        FOR UPDATE
      `);

      if ((conflicts.rows as unknown[]).length > 0) {
        const err = new Error("SLOT_CONFLICT") as Error & { isSlotConflict: boolean };
        err.isSlotConflict = true;
        throw err;
      }

      const [inserted] = await tx
        .insert(bookingsTable)
        .values({
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
        })
        .returning();

      return inserted;
    });
  } catch (e: any) {
    if (redis) await redis.del(lockKey).catch(() => {});
    if (e.isSlotConflict || e.code === "23P01") {
      res.status(409).json({ code: "ERR-005", message: "Ce créneau est déjà réservé, choisissez un autre horaire." });
      return;
    }
    throw e;
  }

  // Release Redis lock after successful commit
  if (redis) await redis.del(lockKey).catch(() => {});

  // Stripe PaymentIntent
  let paymentIntentId = `pi_mock_${bookingId}`;
  let clientSecret = `pi_mock_${bookingId}_secret`;

  if (stripe) {
    try {
      const pi = await stripe.paymentIntents.create({
        amount: service.priceCents,
        currency: "mad",
        metadata: { bookingId: booking.id, providerId: provider.id },
      });
      paymentIntentId = pi.id;
      clientSecret = pi.client_secret!;

      await db
        .update(bookingsTable)
        .set({ paymentIntentId })
        .where(eq(bookingsTable.id, bookingId));
    } catch (err) {
      req.log.error({ err }, "Stripe PaymentIntent creation failed — using mock");
    }
  }

  emitSlotUpdate(provider.id, {
    slotStart: startDatetime.toISOString(),
    staffId,
    change: "booked",
  });

  res.status(201).json({
    bookingId,
    status: "PENDING",
    paymentIntentSecret: clientSecret,
    expiresAt: lockedUntil.toISOString(),
    amountCents: service.priceCents,
    isMock: !stripe,
  });
});

// GET /bookings/me — client's own booking history
router.get("/me", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      id: bookingsTable.id,
      status: bookingsTable.status,
      paymentStatus: bookingsTable.paymentStatus,
      startDatetime: bookingsTable.startDatetime,
      endDatetime: bookingsTable.endDatetime,
      amountCents: bookingsTable.amountCents,
      serviceName: servicesTable.name,
      serviceDuration: servicesTable.durationMinutes,
      staffName: staffTable.name,
      providerName: providersTable.name,
      providerSlug: providersTable.slug,
      providerLogoUrl: providersTable.logoUrl,
      providerCity: providersTable.city,
      hasReview: isNotNull(reviewsTable.id),
    })
    .from(bookingsTable)
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
    .leftJoin(providersTable, eq(bookingsTable.providerId, providersTable.id))
    .leftJoin(reviewsTable, eq(bookingsTable.id, reviewsTable.bookingId))
    .where(eq(bookingsTable.clientId, req.user!.sub))
    .orderBy(desc(bookingsTable.startDatetime));

  res.json(rows);
});

// GET /bookings/:bookingId
router.get("/:bookingId", requireAuth, async (req, res) => {
  const [row] = await db
    .select({
      id: bookingsTable.id,
      status: bookingsTable.status,
      paymentStatus: bookingsTable.paymentStatus,
      startDatetime: bookingsTable.startDatetime,
      endDatetime: bookingsTable.endDatetime,
      amountCents: bookingsTable.amountCents,
      clientId: bookingsTable.clientId,
      staffId: bookingsTable.staffId,
      providerId: bookingsTable.providerId,
      serviceName: servicesTable.name,
      serviceDuration: servicesTable.durationMinutes,
      staffName: staffTable.name,
      providerName: providersTable.name,
      providerSlug: providersTable.slug,
      providerLogoUrl: providersTable.logoUrl,
      providerCity: providersTable.city,
      providerAddress: providersTable.address,
    })
    .from(bookingsTable)
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
    .leftJoin(providersTable, eq(bookingsTable.providerId, providersTable.id))
    .where(eq(bookingsTable.id, req.params.bookingId))
    .limit(1);

  if (!row) { res.status(404).json({ code: "ERR-004", message: "Réservation introuvable" }); return; }
  if (row.clientId !== req.user!.sub && req.user!.role === "CLIENT") {
    res.status(403).json({ code: "ERR-003", message: "Accès refusé" }); return;
  }
  res.json(row);
});

// POST /bookings/:bookingId/cancel — client cancellation (2h window)
router.post("/:bookingId/cancel", requireAuth, async (req, res) => {
  const booking = await db.query.bookingsTable.findFirst({
    where: and(eq(bookingsTable.id, req.params.bookingId), eq(bookingsTable.clientId, req.user!.sub)),
  });
  if (!booking) { res.status(404).json({ code: "ERR-004", message: "Réservation introuvable" }); return; }
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    res.status(409).json({ code: "ERR-005", message: "Réservation déjà annulée" }); return;
  }

  const hoursUntilStart = (booking.startDatetime.getTime() - Date.now()) / 3_600_000;
  if (hoursUntilStart < 2) {
    res.status(409).json({ code: "ERR-006", message: "Annulation impossible moins de 2h avant le rendez-vous" });
    return;
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

// POST /bookings/:bookingId/confirm — manual confirmation (mock/webhook fallback)
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

  // Confirmation email — sent immediately
  enqueueEmailJob({ type: "booking_confirmation", bookingId: booking.id }).catch((err) =>
    req.log.error({ err }, "Failed to enqueue confirmation email"),
  );

  // J-1 reminder — scheduled 24h before appointment (only if > 25h away)
  const msUntilStart = booking.startDatetime.getTime() - Date.now();
  const reminderDelay = msUntilStart - 24 * 60 * 60 * 1000;
  if (reminderDelay > 60_000) {
    enqueueEmailJob({ type: "booking_reminder", bookingId: booking.id }, reminderDelay).catch((err) =>
      req.log.error({ err }, "Failed to enqueue reminder email"),
    );
  }

  res.json({ message: "Réservation confirmée" });
});

export default router;
