import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, staffTable, providersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireOwner } from "../middlewares/auth";

const router = Router({ mergeParams: true });

async function getProviderForOwner(slug: string, ownerId: string) {
  return db.query.providersTable.findFirst({
    where: and(eq(providersTable.slug, slug), eq(providersTable.ownerId, ownerId)),
  });
}

const staffSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

router.get("/", requireOwner, async (req, res) => {
  const provider = await getProviderForOwner(req.params.slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const list = await db.query.staffTable.findMany({ where: eq(staffTable.providerId, provider.id) });
  res.json(list);
});

router.post("/", requireOwner, async (req, res) => {
  const provider = await getProviderForOwner(req.params.slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const parse = staffSchema.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() }); return; }

  const [member] = await db.insert(staffTable).values({
    id: uuidv4(),
    providerId: provider.id,
    ...parse.data,
  }).returning();
  res.status(201).json(member);
});

router.put("/:staffId", requireOwner, async (req, res) => {
  const provider = await getProviderForOwner(req.params.slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  const parse = staffSchema.partial().safeParse(req.body);
  if (!parse.success) { res.status(400).json({ code: "ERR-001", message: "Données invalides" }); return; }

  const [updated] = await db
    .update(staffTable)
    .set({ ...parse.data, updatedAt: new Date() })
    .where(and(eq(staffTable.id, req.params.staffId), eq(staffTable.providerId, provider.id)))
    .returning();
  if (!updated) { res.status(404).json({ code: "ERR-004", message: "Staff introuvable" }); return; }
  res.json(updated);
});

router.delete("/:staffId", requireOwner, async (req, res) => {
  const provider = await getProviderForOwner(req.params.slug, req.user!.sub);
  if (!provider) { res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" }); return; }

  await db
    .update(staffTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(staffTable.id, req.params.staffId), eq(staffTable.providerId, provider.id)));
  res.status(204).send();
});

export default router;
