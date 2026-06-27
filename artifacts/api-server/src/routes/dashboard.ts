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
} from "@workspace/db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { requireOwner } from "../middlewares/auth";
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
    db.query.servicesTable.findMany({ where: and(eq(servicesTable.providerId, provider.id), eq(servicesTable.isActive, true)) }),
  ]);
  res.json({ ...provider, staff, services });
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
    where: and(eq(scheduleBlocksTable.id, req.params.blockId), eq(scheduleBlocksTable.providerId, provider.id)),
  });
  if (!block) { res.status(404).json({ code: "ERR-004", message: "Blocage introuvable" }); return; }

  await db.delete(scheduleBlocksTable).where(eq(scheduleBlocksTable.id, req.params.blockId));

  emitSlotUpdate(provider.id, {
    slotStart: block.startDatetime.toISOString(),
    staffId: block.staffId ?? "all",
    change: "released",
  });

  res.status(204).send();
});

router.get("/analytics", requireOwner, async (req, res) => {
  const provider = await getOwnedProvider(req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" }); return; }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60_000);

  const allBookings = await db.query.bookingsTable.findMany({
    where: and(eq(bookingsTable.providerId, provider.id), gte(bookingsTable.createdAt, thirtyDaysAgo)),
  });

  const confirmed = allBookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  const totalRevenue = confirmed.reduce((sum, b) => sum + b.amountCents, 0);
  const totalBookings = confirmed.length;

  const bookingsByDay: Record<string, number> = {};
  for (const b of confirmed) {
    const day = b.startDatetime.toISOString().slice(0, 10);
    bookingsByDay[day] = (bookingsByDay[day] ?? 0) + 1;
  }

  const serviceCount: Record<string, { count: number; name: string }> = {};
  for (const b of confirmed) {
    if (!serviceCount[b.serviceId]) {
      serviceCount[b.serviceId] = { count: 0, name: b.serviceId };
    }
    serviceCount[b.serviceId].count++;
  }

  const services = await db.query.servicesTable.findMany({ where: eq(servicesTable.providerId, provider.id) });
  const topServices = Object.entries(serviceCount)
    .map(([id, data]) => ({
      serviceId: id,
      name: services.find((s) => s.id === id)?.name ?? id,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const staff = await db.query.staffTable.findMany({
    where: and(eq(staffTable.providerId, provider.id), eq(staffTable.isActive, true)),
  });

  const workingHours = 10 * 30;
  const fillRate = staff.length > 0 ? Math.min(100, (totalBookings / (staff.length * workingHours)) * 100) : 0;

  res.json({
    totalBookings,
    estimatedRevenueCents: totalRevenue,
    fillRate: Math.round(fillRate * 10) / 10,
    bookingsByDay: Object.entries(bookingsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topServices,
  });
});

export default router;
