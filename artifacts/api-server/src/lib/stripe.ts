import Stripe from "stripe";
import { logger } from "./logger";

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia",
  });
} else {
  logger.warn("STRIPE_SECRET_KEY not set — Stripe payments are mocked");
}

export { stripe };
