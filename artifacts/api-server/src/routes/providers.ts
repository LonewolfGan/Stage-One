import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  db,
  providersTable,
  staffTable,
  servicesTable,
  businessHoursTable,
  reviewsTable,
  subscriptionsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireOwner } from "../middlewares/auth";

type ProviderRow = {
  id: string;
  type: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  status: string;
  distanceKm?: number | null;
};

const router = Router();

const CANONICAL_CATEGORIES = [
  { id: "COIFFEUR",   label: "Coiffeur" },
  { id: "BARBIER",    label: "Barbier" },
  { id: "MANUCURE",   label: "Manucure" },
  { id: "BEAUTE",     label: "Institut beauté" },
  { id: "BIENETRE",   label: "Bien-être" },
  { id: "MAQUILLAGE", label: "Maquillage" },
  { id: "SOIN",       label: "Soin visage" },
  { id: "MASSAGE",    label: "Massage" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.get("/", async (req, res) => {
  const { city, type, q, lat, lng, radius, sort } = req.query as Record<string, string>;

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const radiusKm = Math.min(parseFloat(radius ?? "25") || 25, 100);
  const useGeo = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng);

  let providers: ProviderRow[];

  if (useGeo) {
    const result = await db.execute(sql`
      SELECT
        id, type, name, slug, description, phone, city,
        latitude, longitude, logo_url AS "logoUrl", status,
        ROUND(
          (ST_Distance(
            location,
            ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
          ) / 1000.0)::numeric,
          1
        )::float AS "distanceKm"
      FROM providers
      WHERE status = 'ACTIVE'
        AND location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
          ${radiusKm * 1000}
        )
      ORDER BY "distanceKm" ASC
    `);
    providers = result.rows as ProviderRow[];
  } else {
    providers = await db
      .select({
        id: providersTable.id,
        type: providersTable.type,
        name: providersTable.name,
        slug: providersTable.slug,
        description: providersTable.description,
        phone: providersTable.phone,
        city: providersTable.city,
        latitude: providersTable.latitude,
        longitude: providersTable.longitude,
        logoUrl: providersTable.logoUrl,
        status: providersTable.status,
      })
      .from(providersTable)
      .where(eq(providersTable.status, "ACTIVE"));
  }

  let filtered = providers;
  if (!useGeo && city) filtered = filtered.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()));
  if (type) filtered = filtered.filter((p) => p.type === type.toUpperCase());
  if (q) filtered = filtered.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const enriched = await Promise.all(
    filtered.map(async (p) => {
      const [staffList, serviceList, reviews] = await Promise.all([
        db.query.staffTable.findMany({ where: and(eq(staffTable.providerId, p.id), eq(staffTable.isActive, true)) }),
        db.query.servicesTable.findMany({ where: and(eq(servicesTable.providerId, p.id), eq(servicesTable.isActive, true)) }),
        db.query.reviewsTable.findMany({ where: eq(reviewsTable.providerId, p.id) }),
      ]);
      const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;
      const minPriceCents = serviceList.length > 0 ? Math.min(...serviceList.map((s) => s.priceCents)) : null;
      const minDurationMinutes = serviceList.length > 0 ? Math.min(...serviceList.map((s) => s.durationMinutes)) : null;
      return {
        ...p,
        staffCount: staffList.length,
        serviceCount: serviceList.length,
        avgRating,
        reviewCount: reviews.length,
        minPriceCents,
        minDurationMinutes,
        distanceKm: p.distanceKm ?? null,
      };
    }),
  );

  if (sort === "rating") {
    enriched.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  res.json(enriched);
});

router.get("/categories", async (_req, res) => {
  res.json(CANONICAL_CATEGORIES);
});

router.get("/cities", async (_req, res) => {
  const rows = await db.execute(sql`
    SELECT DISTINCT city, COUNT(*) AS count
    FROM providers
    WHERE status = 'ACTIVE'
    GROUP BY city
    ORDER BY count DESC
  `);
  const cities = (rows.rows as { city: string; count: string }[]).map((r) => ({
    name: r.city,
    count: parseInt(r.count, 10),
  }));
  res.json(cities);
});

router.get("/:slug", async (req, res) => {
  const provider = await db.query.providersTable.findFirst({
    where: eq(providersTable.slug, req.params.slug),
  });
  if (!provider) {
    res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" });
    return;
  }

  const [staffList, serviceList, hours] = await Promise.all([
    db.query.staffTable.findMany({ where: and(eq(staffTable.providerId, provider.id), eq(staffTable.isActive, true)) }),
    db.query.servicesTable.findMany({ where: and(eq(servicesTable.providerId, provider.id), eq(servicesTable.isActive, true)) }),
    db.query.businessHoursTable.findMany({ where: eq(businessHoursTable.providerId, provider.id) }),
  ]);

  const reviewRows = await db.execute(sql`
    SELECT r.id, r.booking_id AS "bookingId", r.provider_id AS "providerId",
           r.client_id AS "clientId", r.rating, r.comment, r.reply, r.created_at AS "createdAt",
           u.name AS "clientName"
    FROM reviews r
    LEFT JOIN users u ON r.client_id = u.id
    WHERE r.provider_id = ${provider.id}
    ORDER BY r.created_at DESC
  `);
  const reviews = (reviewRows.rows as Array<{
    id: string; bookingId: string; providerId: string; clientId: string;
    rating: number; comment: string | null; reply: string | null;
    createdAt: string; clientName: string | null;
  }>).map((r) => ({ ...r, clientName: r.clientName ?? "Client anonyme" }));

  const serviceStaff = await Promise.all(
    serviceList.map(async (s) => {
      const rows = await db.execute(
        sql`SELECT staff_id FROM service_staff WHERE service_id = ${s.id}`,
      );
      return { ...s, staffIds: (rows.rows as { staff_id: string }[]).map((r) => r.staff_id) };
    }),
  );

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  res.json({ ...provider, staff: staffList, services: serviceStaff, businessHours: hours, reviews, avgRating });
});

const registerProviderSchema = z.object({
  type: z.enum(["ESTABLISHMENT", "INDIVIDUAL"]),
  name: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(8),
  email: z.string().email(),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post("/register", requireOwner, async (req, res) => {
  const parse = registerProviderSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() });
    return;
  }

  const existing = await db.query.providersTable.findFirst({
    where: eq(providersTable.ownerId, req.user!.sub),
  });
  if (existing) {
    res.status(409).json({ code: "ERR-005", message: "Vous avez déjà un espace prestataire" });
    return;
  }

  const { type, name, city, phone, email, description, address, latitude, longitude } = parse.data;
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;
  while (await db.query.providersTable.findFirst({ where: eq(providersTable.slug, slug) })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const providerId = uuidv4();

  await db.insert(providersTable).values({
    id: providerId,
    type,
    name,
    slug,
    city,
    phone,
    email,
    description,
    address,
    latitude,
    longitude,
    ownerId: req.user!.sub,
    status: "ACTIVE",
  });

  if (type === "INDIVIDUAL") {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user!.sub) });
    await db.insert(staffTable).values({
      id: uuidv4(),
      providerId,
      name: user?.name ?? name,
      isActive: true,
    });
  }

  await db.insert(subscriptionsTable).values({
    id: uuidv4(),
    providerId,
    plan: "FREE",
    status: "active",
  });

  const provider = await db.query.providersTable.findFirst({ where: eq(providersTable.id, providerId) });
  res.status(201).json(provider);
});

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean().default(false),
    }),
  ),
});

router.put("/:slug/hours", requireOwner, async (req, res) => {
  const provider = await db.query.providersTable.findFirst({
    where: and(eq(providersTable.slug, req.params.slug as string), eq(providersTable.ownerId, req.user!.sub)),
  });
  if (!provider) {
    res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" });
    return;
  }

  const parse = hoursSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides" });
    return;
  }

  await db.delete(businessHoursTable).where(eq(businessHoursTable.providerId, provider.id));
  if (parse.data.hours.length > 0) {
    await db.insert(businessHoursTable).values(
      parse.data.hours.map((h) => ({ id: uuidv4(), providerId: provider.id, ...h })),
    );
  }

  const updated = await db.query.businessHoursTable.findMany({ where: eq(businessHoursTable.providerId, provider.id) });
  res.json(updated);
});

export default router;
