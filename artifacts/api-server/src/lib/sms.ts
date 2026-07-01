/**
 * sms.ts — SMS notifications via Twilio REST API
 *
 * Gracefully mocked if TWILIO_* env vars are absent.
 * Uses native fetch (Node.js ≥18) — no extra dependency.
 */

import { logger } from "./logger";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM_PHONE  = process.env.TWILIO_FROM_PHONE;

const isMocked = !ACCOUNT_SID || !AUTH_TOKEN || !FROM_PHONE;

if (isMocked) {
  logger.warn("TWILIO_* vars not set — SMS notifications are logged only");
}

/**
 * Send an SMS. Silently mocked when Twilio creds are absent.
 * @param to  E.164 phone number (e.g. +212661234567)
 * @param body Message text (≤160 chars recommended)
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (isMocked) {
    logger.info({ to, body }, "[SMS mock] would send");
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To",   to);
  form.set("From", FROM_PHONE!);
  form.set("Body", body);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, body: text, to }, "Twilio SMS failed");
    } else {
      logger.info({ to }, "SMS sent via Twilio");
    }
  } catch (err) {
    logger.error({ err, to }, "Twilio SMS network error");
  }
}

/**
 * Format a Date to French locale string in Casablanca timezone.
 */
export function formatDateFr(date: Date): string {
  return date.toLocaleString("fr-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  });
}
