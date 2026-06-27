import Stripe from "stripe";
import { logger } from "./logger";

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
  });
} else {
  logger.warn("STRIPE_SECRET_KEY not set — Stripe payments are mocked");
}

export { stripe };
