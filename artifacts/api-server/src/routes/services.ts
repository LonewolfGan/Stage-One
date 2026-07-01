import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, servicesTable, serviceStaffTable, providersTable, staffTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireOwner } from "../middlewares/auth";

const router = Router({ mergeParams: true });

// req.params includes merged params from parent router (e.g. :slug)
type MergedParams = Record<string, string>;

async function getProviderForOwner(slug: string, ownerId: string) {
  return db.query.providersTable.findFirst({
    where: and(eq(providersTable.slug, slug), eq(providersTable.ownerId, ownerId)),
  });
}

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5),
  priceCents: z.number().int().min(0),
  bufferMinutes: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  staffIds: z.array(z.string()).optional(),
});

router.get("/", async (req, res) => {
  const { slug } = req.params as MergedParams;
  const provider = await db.query.providersTable.findFirst({
    where: eq(providersTable.slug, slug),
  });
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const list = await db.query.servicesTable.findMany({
    where: and(eq(servicesTable.providerId, provider.id), eq(servicesTable.isActive, true)),
  });
  res.json(list);
});

router.post("/", requireOwner, async (req, res) => {
  const { slug } = req.params as MergedParams;
  const provider = await getProviderForOwner(slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const parse = serviceSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() }); return; }

  const { staffIds, ...serviceData } = parse.data;
  const serviceId = uuidv4();

  await db.insert(servicesTable).values({ id: serviceId, providerId: provider.id, ...serviceData });

  if (staffIds && staffIds.length > 0) {
    await db.insert(serviceStaffTable).values(
      staffIds.map((sid) => ({ serviceId, staffId: sid })),
    );
  }

  const service = await db.query.servicesTable.findFirst({ where: eq(servicesTable.id, serviceId) });
  res.status(201).json(service);
});

router.put("/:serviceId", requireOwner, async (req, res) => {
  const { slug, serviceId } = req.params as MergedParams;
  const provider = await getProviderForOwner(slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const parse = serviceSchema.partial().safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides" }); return; }

  const { staffIds, ...serviceData } = parse.data;

  const [updated] = await db
    .update(servicesTable)
    .set({ ...serviceData, updatedAt: new Date() })
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.providerId, provider.id)))
    .returning();
  if (!updated) { res.status(404).json({ code: "ERR-004", message: "Prestation introuvable" }); return; }

  if (staffIds !== undefined) {
    await db.delete(serviceStaffTable).where(eq(serviceStaffTable.serviceId, serviceId));
    if (staffIds.length > 0) {
      await db.insert(serviceStaffTable).values(staffIds.map((sid) => ({ serviceId, staffId: sid })));
    }
  }

  res.json(updated);
});

router.delete("/:serviceId", requireOwner, async (req, res) => {
  const { slug, serviceId } = req.params as MergedParams;
  const provider = await getProviderForOwner(slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  await db
    .update(servicesTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.providerId, provider.id)));
  res.status(204).send();
});

export default router;
