import { type Request, type Response } from "express";
import { stripe } from "../lib/stripe";
import { db, bookingsTable, subscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { notifyBookingConfirmed, notifySlotReleased } from "../lib/notify";
import { logger } from "../lib/logger";
import { v4 as uuidv4 } from "uuid";

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

  try {
    switch (event.type) {
      // ── Booking payment ─────────────────────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as { metadata?: { bookingId?: string } };
        const bookingId = pi.metadata?.bookingId;
        if (!bookingId) break;

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
        const pi = event.data.object as { metadata?: { bookingId?: string } };
        const bookingId = pi.metadata?.bookingId;
        if (!bookingId) break;

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

      case "charge.refunded": {
        const charge = event.data.object as { payment_intent?: string };
        if (!charge.payment_intent) break;

        await db
          .update(bookingsTable)
          .set({ paymentStatus: "refunded", updatedAt: new Date() })
          .where(eq(bookingsTable.paymentIntentId, charge.payment_intent as string));

        logger.info({ paymentIntentId: charge.payment_intent }, "Charge refunded — booking paymentStatus updated");
        break;
      }

      // ── Subscription lifecycle ───────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as {
          id: string;
          customer: string;
          status: string;
          metadata?: { providerId?: string; plan?: string };
          current_period_start: number;
          current_period_end: number;
          items: { data: { price: { id: string } }[] };
        };

        const providerId = sub.metadata?.providerId;
        if (!providerId) {
          logger.warn({ subId: sub.id }, "Subscription webhook missing providerId in metadata");
          break;
        }

        // Determine plan from metadata or price ID mapping
        const plan = sub.metadata?.plan as "FREE" | "PRO" | "BUSINESS" | undefined;
        const resolvedPlan: "FREE" | "PRO" | "BUSINESS" =
          plan ?? (sub.status === "active" ? "PRO" : "FREE");

        const stripeStatus = sub.status === "active" ? "active" : sub.status;

        const existing = await db.query.subscriptionsTable.findFirst({
          where: eq(subscriptionsTable.providerId, providerId),
        });

        if (existing) {
          await db.update(subscriptionsTable)
            .set({
              plan: resolvedPlan,
              status: stripeStatus,
              stripeSubscriptionId: sub.id,
              stripeCustomerId: sub.customer as string,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.providerId, providerId));
        } else {
          await db.insert(subscriptionsTable).values({
            id: uuidv4(),
            providerId,
            plan: resolvedPlan,
            status: stripeStatus,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
          });
        }

        logger.info({ providerId, plan: resolvedPlan, status: stripeStatus }, "Subscription updated via webhook");
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as {
          id: string;
          metadata?: { providerId?: string };
        };

        const providerId = sub.metadata?.providerId;
        if (!providerId) break;

        await db.update(subscriptionsTable)
          .set({ plan: "FREE", status: "cancelled", stripeSubscriptionId: null, updatedAt: new Date() })
          .where(eq(subscriptionsTable.providerId, providerId));

        logger.info({ providerId }, "Subscription deleted — downgraded to FREE");
        break;
      }

      default:
        logger.info({ type: event.type }, "Stripe webhook event (unhandled)");
    }
  } catch (err) {
    logger.error({ err, type: event.type }, "Error processing Stripe webhook event");
    // Still return 200 to avoid Stripe retries for non-transient errors
  }

  res.json({ received: true });
}
