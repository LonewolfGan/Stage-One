import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  db,
  bookingsTable,
  scheduleBlocksTable,
  providersTable,
  servicesTable,
  staffTable,
  usersTable,
  businessHoursTable,
  subscriptionsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, gte, lt, sql, desc } from "drizzle-orm";
import { requireOwner, requirePlan } from "../middlewares/auth";
import { emitSlotUpdate } from "../lib/socket";

const router = Router();

async function getOwnedProvider(ownerId: string) {
  return db.query.providersTable.findFirst({ where: eq(providersTable.ownerId, ownerId) });
}

router.get("/provider", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }
  const [staff, services] = await Promise.all([
    db.query.staffTable.findMany({ where: and(eq(staffTable.providerId, provider.id), eq(staffTable.isActive, true)) }),
    db.query.servicesTable.findMany({ where: eq(servicesTable.providerId, provider.id) }),
  ]);
  res.json({ ...provider, staff, services });
});

// ── Photo upload (base64, dev fallback — no cloud storage required) ──────────

const uploadPhotoSchema = z.object({ dataUri: z.string().startsWith("data:image/") });

router.post("/provider/upload-logo", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const parse = uploadPhotoSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "dataUri invalide — doit commencer par data:image/" }); return; }

  // Store base64 directly in logoUrl (dev fallback — replace with R2/S3 URL in prod)
  await db.update(providersTable).set({ logoUrl: parse.data.dataUri }).where(eq(providersTable.id, provider.id));
  res.json({ logoUrl: parse.data.dataUri });
});

router.post("/provider/upload-photo", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const parse = uploadPhotoSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "dataUri invalide — doit commencer par data:image/" }); return; }

  // Append to existing photos array (stored as JSON in column)
  const existing: string[] = Array.isArray((provider as any).photos) ? (provider as any).photos : [];
  if (existing.length >= 10) { res.status(400).json({ code: "ERR-002", message: "Maximum 10 photos atteint" }); return; }
  const updated = [...existing, parse.data.dataUri];
  await db.update(providersTable).set({ photos: updated } as any).where(eq(providersTable.id, provider.id));
  res.json({ photoUrl: parse.data.dataUri, photos: updated });
});

router.post("/provider/delete-photo", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const { photoUrl } = req.body as { photoUrl?: string };
  if (!photoUrl) { res.status(400).json({ code: "ERR-001", message: "photoUrl requis" }); return; }

  const existing: string[] = Array.isArray((provider as any).photos) ? (provider as any).photos : [];
  const updated = existing.filter((p) => p !== photoUrl);
  await db.update(providersTable).set({ photos: updated } as any).where(eq(providersTable.id, provider.id));
  res.json({ photos: updated });
});

router.get("/bookings", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const { date, staffId } = req.query as Record<string, string>;
  if (!date) { res.status(400).json({ code: "ERR-001", message: "date requis (YYYY-MM-DD)" }); return; }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const conditions = [
    eq(bookingsTable.providerId, provider.id),
    gte(bookingsTable.startDatetime, dayStart),
    lt(bookingsTable.startDatetime, dayEnd),
  ];
  if (staffId) conditions.push(eq(bookingsTable.staffId, staffId));

  const bookings = await db.query.bookingsTable.findMany({ where: and(...conditions) });

  const enriched = await Promise.all(
    bookings.map(async (b) => {
      const [service, staff, client] = await Promise.all([
        db.query.servicesTable.findFirst({ where: eq(servicesTable.id, b.serviceId) }),
        db.query.staffTable.findFirst({ where: eq(staffTable.id, b.staffId) }),
        db.query.usersTable.findFirst({ where: eq(usersTable.id, b.clientId), columns: { passwordHash: false } }),
      ]);
      return { ...b, service, staff, client };
    }),
  );

  res.json(enriched);
});

const blockSchema = z.object({
  staffId: z.string().optional(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  title: z.string().optional(),
});

router.post("/blocks", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const parse = blockSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() }); return; }

  const blockId = uuidv4();
  await db.insert(scheduleBlocksTable).values({
    id: blockId,
    providerId: provider.id,
    staffId: parse.data.staffId ?? null,
    type: "MANUAL_BLOCK",
    title: parse.data.title,
    startDatetime: new Date(parse.data.startDatetime),
    endDatetime: new Date(parse.data.endDatetime),
  });

  emitSlotUpdate(provider.id, {
    slotStart: parse.data.startDatetime,
    staffId: parse.data.staffId ?? "all",
    change: "booked",
  });

  const block = await db.query.scheduleBlocksTable.findFirst({ where: eq(scheduleBlocksTable.id, blockId) });
  res.status(201).json(block);
});

router.delete("/blocks/:blockId", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const block = await db.query.scheduleBlocksTable.findFirst({
    where: and(eq(scheduleBlocksTable.id, req.params.blockId as string), eq(scheduleBlocksTable.providerId, provider.id)),
  });
  if (!block) { res.status(404).json({ code: "ERR-004", message: "Blocage introuvable" }); return; }

  await db.delete(scheduleBlocksTable).where(eq(scheduleBlocksTable.id, req.params.blockId as string));

  emitSlotUpdate(provider.id, {
    slotStart: block.startDatetime.toISOString(),
    staffId: block.staffId ?? "all",
    change: "released",
  });

  res.status(204).send();
});

// ── Business Hours ──────────────────────────────────────────────────────────

const businessHoursUpdateSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      isClosed: z.boolean(),
    }),
  ),
});

router.get("/business-hours", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const rows = await db.query.businessHoursTable.findMany({
    where: eq(businessHoursTable.providerId, provider.id),
    orderBy: (t, { asc }) => [asc(t.dayOfWeek)],
  });
  res.json(rows);
});

router.put("/business-hours", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const parse = businessHoursUpdateSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() }); return; }

  await db.delete(businessHoursTable).where(eq(businessHoursTable.providerId, provider.id));

  if (parse.data.hours.length > 0) {
    await db.insert(businessHoursTable).values(
      parse.data.hours.map((h) => ({
        id: uuidv4(),
        providerId: provider.id,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime ?? "09:00",
        closeTime: h.closeTime ?? "19:00",
        isClosed: h.isClosed,
      })),
    );
  }

  res.json({ success: true });
});

// ── Subscriptions ────────────────────────────────────────────────────────────

const planSchema = z.object({ plan: z.enum(["FREE", "PRO", "BUSINESS"]) });

router.get("/subscription", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const sub = await db.query.subscriptionsTable.findFirst({
    where: eq(subscriptionsTable.providerId, provider.id),
  });

  res.json(sub ?? { plan: "FREE", status: "active" });
});

router.put("/subscription/plan", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const parse = planSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() }); return; }

  const existing = await db.query.subscriptionsTable.findFirst({
    where: eq(subscriptionsTable.providerId, provider.id),
  });

  if (existing) {
    await db
      .update(subscriptionsTable)
      .set({ plan: parse.data.plan, updatedAt: new Date() })
      .where(eq(subscriptionsTable.providerId, provider.id));
  } else {
    await db.insert(subscriptionsTable).values({
      id: uuidv4(),
      providerId: provider.id,
      plan: parse.data.plan,
      status: "active",
    });
  }

  const updated = await db.query.subscriptionsTable.findFirst({
    where: eq(subscriptionsTable.providerId, provider.id),
  });
  res.json(updated);
});

router.get("/analytics", requireOwner, requirePlan("PRO"), async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const period = (req.query.period as string) ?? "30d";
  const now = new Date();
  let since: Date;
  let periodDays: number;
  switch (period) {
    case "7d":  since = new Date(now.getTime() - 7   * 24 * 60 * 60_000); periodDays = 7;   break;
    case "3m":  since = new Date(now.getTime() - 90  * 24 * 60 * 60_000); periodDays = 90;  break;
    case "1y":  since = new Date(now.getTime() - 365 * 24 * 60 * 60_000); periodDays = 365; break;
    default:    since = new Date(now.getTime() - 30  * 24 * 60 * 60_000); periodDays = 30;
  }

  const allBookings = await db.query.bookingsTable.findMany({
    where: and(eq(bookingsTable.providerId, provider.id), gte(bookingsTable.startDatetime, since)),
  });

  const confirmed = allBookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  const totalRevenue = confirmed.reduce((sum, b) => sum + b.amountCents, 0);
  const totalBookings = confirmed.length;
  const uniqueClients = new Set(confirmed.map((b) => b.clientId)).size;

  const bookingsByDay: Record<string, number> = {};
  for (const b of confirmed) {
    const day = b.startDatetime.toISOString().slice(0, 10);
    bookingsByDay[day] = (bookingsByDay[day] ?? 0) + 1;
  }

  const serviceCount: Record<string, { count: number; revenueCents: number }> = {};
  for (const b of confirmed) {
    if (!serviceCount[b.serviceId]) serviceCount[b.serviceId] = { count: 0, revenueCents: 0 };
    serviceCount[b.serviceId].count++;
    serviceCount[b.serviceId].revenueCents += b.amountCents;
  }

  const [services, staff] = await Promise.all([
    db.query.servicesTable.findMany({ where: eq(servicesTable.providerId, provider.id) }),
    db.query.staffTable.findMany({ where: and(eq(staffTable.providerId, provider.id), eq(staffTable.isActive, true)) }),
  ]);

  const topServices = Object.entries(serviceCount)
    .map(([id, data]) => ({
      serviceId: id,
      name: services.find((s) => s.id === id)?.name ?? id,
      count: data.count,
      revenueCents: data.revenueCents,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const staffBookingCount: Record<string, number> = {};
  for (const b of confirmed) staffBookingCount[b.staffId] = (staffBookingCount[b.staffId] ?? 0) + 1;
  const staffPerformance = staff
    .map((s) => ({ staffId: s.id, name: s.name, bookings: staffBookingCount[s.id] ?? 0 }))
    .sort((a, b) => b.bookings - a.bookings);

  const slotsTotal = staff.length * periodDays * 10;
  const fillRate = slotsTotal > 0 ? Math.min(100, (totalBookings / slotsTotal) * 100) : 0;

  res.json({
    period,
    totalBookings,
    estimatedRevenueCents: totalRevenue,
    revenueMad: Math.round(totalRevenue / 100),
    uniqueClients,
    fillRate: Math.round(fillRate * 10) / 10,
    bookingsByDay: Object.entries(bookingsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topServices,
    staffPerformance,
  });
});

// ── Notifications ─────────────────────────────────────────────────────────────

// GET /dashboard/notifications — list last 50, unread first
router.get("/notifications", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.providerId, provider.id))
    .orderBy(sql`is_read ASC`, desc(notificationsTable.createdAt))
    .limit(50);

  const unreadCount = rows.filter((n) => !n.isRead).length;

  res.json({ notifications: rows, unreadCount });
});

// POST /dashboard/notifications/:id/read — mark one as read
router.post("/notifications/:id/read", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, req.params.id as string),
        eq(notificationsTable.providerId, provider.id),
      ),
    );

  res.json({ success: true });
});

// POST /dashboard/notifications/read-all — mark all as read
router.post("/notifications/read-all", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.providerId, provider.id),
        eq(notificationsTable.isRead, false),
      ),
    );

  res.json({ success: true });
});

export default router;
