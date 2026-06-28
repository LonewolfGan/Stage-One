import { type Request, type Response } from "express";
import { stripe } from "../lib/stripe";
import { db, bookingsTable, servicesTable, staffTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { emitBookingConfirmed, emitSlotUpdate } from "../lib/socket";
import { logger } from "../lib/logger";
import { enqueueEmailJob } from "../lib/email-worker";

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
      await db
        .update(bookingsTable)
        .set({ status: "CONFIRMED", paymentStatus: "paid", updatedAt: new Date() })
        .where(eq(bookingsTable.id, bookingId));

      const booking = await db.query.bookingsTable.findFirst({ where: eq(bookingsTable.id, bookingId) });
      if (booking) {
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
        logger.info({ bookingId }, "Payment succeeded — booking confirmed");
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
        emitSlotUpdate(booking.providerId, {
          slotStart: booking.startDatetime.toISOString(),
          staffId: booking.staffId,
          change: "released",
        });
        logger.info({ bookingId }, "Payment failed — slot released");
      }
      break;
    }

    default:
      logger.info({ type: event.type }, "Stripe webhook event (unhandled)");
  }

  res.json({ received: true });
}
