import { Router } from "express";
import { z } from "zod";
import { db, providersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAvailableSlots } from "../lib/slot-engine";

const router = Router({ mergeParams: true });

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffId: z.string().optional(),
});

router.get("/", async (req, res) => {
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "serviceId et date (YYYY-MM-DD) requis", errors: parse.error.flatten() });
    return;
  }

  const provider = await db.query.providersTable.findFirst({
    where: eq(providersTable.slug, (req.params as Record<string, string>).slug as string),
  });
  if (!provider) {
    res.status(404).json({ code: "ERR-004", message: "Prestataire introuvable" });
    return;
  }

  const slots = await getAvailableSlots(
    provider.id,
    parse.data.serviceId,
    parse.data.date,
    parse.data.staffId,
  );

  res.json(slots);
});

export default router;
