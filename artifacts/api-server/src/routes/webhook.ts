import { type Request, type Response } from "express";
import { stripe } from "../lib/stripe";
import { db, bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { notifyBookingConfirmed, notifySlotReleased } from "../lib/notify";
import { logger } from "../lib/logger";

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!stripe) {
    res.status(503).json({ message: "Stripe non configuré" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET non défini");
    res.status(500).json({ message: "Webhook secret manquant" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: any) {
    logger.warn({ err: err.message }, "Stripe webhook signature invalide");
    res.status(400).json({ message: `Webhook Error: ${err.message}` });
    return;
  }

  const pi = event.data.object as { metadata?: { bookingId?: string } };
  const bookingId = pi.metadata?.bookingId;

  if (!bookingId) {
    res.json({ received: true });
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      // Guard: only update if still PENDING → CONFIRMED transition.
      // Stripe retries webhooks on network errors; without this guard a retry
      // would send duplicate emails and create duplicate DB notifications.
      const [updated] = await db
        .update(bookingsTable)
        .set({ status: "CONFIRMED", paymentStatus: "paid", updatedAt: new Date() })
        .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "PENDING")))
        .returning({ id: bookingsTable.id });

      if (updated) {
        const booking = await db.query.bookingsTable.findFirst({ where: eq(bookingsTable.id, bookingId) });
        if (booking) {
          await notifyBookingConfirmed(booking);
          logger.info({ bookingId }, "Payment succeeded — booking confirmed");
        }
      } else {
        logger.info({ bookingId }, "Payment succeeded — booking already processed (idempotent skip)");
      }
      break;
    }

    case "payment_intent.payment_failed": {
      await db
        .update(bookingsTable)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "PENDING")));

      const booking = await db.query.bookingsTable.findFirst({ where: eq(bookingsTable.id, bookingId) });
      if (booking) {
        notifySlotReleased(booking);
        logger.info({ bookingId }, "Payment failed — slot released");
      }
      break;
    }

    default:
      logger.info({ type: event.type }, "Stripe webhook event (unhandled)");
  }

  res.json({ received: true });
}
