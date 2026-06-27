import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, reviewsTable, bookingsTable, providersTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireOwner } from "../middlewares/auth";

const router = Router();

// GET /reviews — provider dashboard: all reviews with client name
router.get("/", requireOwner, async (req, res) => {
  const provider = await db.query.providersTable.findFirst({
    where: eq(providersTable.ownerId, req.user!.sub),
  });
  if (!provider) {
    res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" });
    return;
  }

  const reviews = await db
    .select({
      id: reviewsTable.id,
      bookingId: reviewsTable.bookingId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      reply: reviewsTable.reply,
      createdAt: reviewsTable.createdAt,
      clientName: usersTable.name,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.clientId, usersTable.id))
    .where(eq(reviewsTable.providerId, provider.id))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews);
});

// POST /reviews — client creates a review
const createReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parse = createReviewSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides", errors: parse.error.flatten() });
    return;
  }

  const { bookingId, rating, comment } = parse.data;

  const booking = await db.query.bookingsTable.findFirst({
    where: and(
      eq(bookingsTable.id, bookingId),
      eq(bookingsTable.clientId, req.user!.sub),
    ),
  });

  if (!booking) {
    res.status(404).json({ code: "ERR-004", message: "Réservation introuvable" });
    return;
  }

  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
    res.status(409).json({ code: "ERR-007", message: "Seules les réservations terminées peuvent être notées" });
    return;
  }

  if (booking.endDatetime > new Date()) {
    res.status(409).json({ code: "ERR-007", message: "Impossible de noter un rendez-vous à venir" });
    return;
  }

  const existing = await db.query.reviewsTable.findFirst({
    where: eq(reviewsTable.bookingId, bookingId),
  });
  if (existing) {
    res.status(409).json({ code: "ERR-005", message: "Vous avez déjà noté ce rendez-vous" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      id: uuidv4(),
      bookingId,
      providerId: booking.providerId,
      clientId: req.user!.sub,
      rating,
      comment: comment ?? null,
      reply: null,
    })
    .returning();

  res.status(201).json(review);
});

// POST /reviews/:id/reply — provider replies to a review
const replySchema = z.object({
  reply: z.string().min(1).max(1000),
});

router.post("/:id/reply", requireOwner, async (req, res) => {
  const parse = replySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ code: "ERR-001", message: "Données invalides" });
    return;
  }

  const provider = await db.query.providersTable.findFirst({
    where: eq(providersTable.ownerId, req.user!.sub),
  });
  if (!provider) {
    res.status(404).json({ code: "ERR-004", message: "Espace prestataire introuvable" });
    return;
  }

  const review = await db.query.reviewsTable.findFirst({
    where: and(
      eq(reviewsTable.id, req.params.id),
      eq(reviewsTable.providerId, provider.id),
    ),
  });
  if (!review) {
    res.status(404).json({ code: "ERR-004", message: "Avis introuvable" });
    return;
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ reply: parse.data.reply })
    .where(eq(reviewsTable.id, req.params.id))
    .returning();

  res.json(updated);
});

export default router;
