/**
 * sms.ts — SMS notifications via Vonage (alternative à Twilio)
 *
 * Variables d'env requises :
 *   VONAGE_API_KEY      — clé API Vonage
 *   VONAGE_API_SECRET   — secret API Vonage
 *   VONAGE_FROM         — numéro ou nom expéditeur (ex: "ANUBIS")
 *
 * Gracefully mocked (log uniquement) si les vars sont absentes.
 * Utilise fetch natif Node.js ≥18 — pas de dépendance supplémentaire.
 */

import { logger } from "./logger";

const API_KEY    = process.env.VONAGE_API_KEY;
const API_SECRET = process.env.VONAGE_API_SECRET;
const FROM       = process.env.VONAGE_FROM ?? "ANUBIS";

const isMocked = !API_KEY || !API_SECRET;

if (isMocked) {
  logger.warn("VONAGE_API_KEY / VONAGE_API_SECRET non définis — SMS en mode log uniquement");
}

/**
 * Envoie un SMS. Silencieusement mocké si Vonage n'est pas configuré.
 * @param to   Numéro E.164 (ex : +212661234567)
 * @param body Texte du message (≤160 caractères recommandé)
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (isMocked) {
    logger.info({ to, body }, "[SMS mock] would send");
    return;
  }

  const url = "https://rest.nexmo.com/sms/json";
  const params = new URLSearchParams({
    api_key:    API_KEY!,
    api_secret: API_SECRET!,
    to,
    from:  FROM,
    text:  body,
  });

  try {
    const res  = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });
    const json = await res.json() as any;
    const msg  = json?.messages?.[0];
    if (msg?.status !== "0") {
      logger.error({ status: msg?.status, errorText: msg?.["error-text"], to }, "Vonage SMS failed");
    } else {
      logger.info({ to, messageId: msg?.["message-id"] }, "SMS envoyé via Vonage");
    }
  } catch (err) {
    logger.error({ err, to }, "Vonage SMS network error");
  }
}

/**
 * Formate une Date en chaîne française (fuseau Casablanca).
 */
export function formatDateFr(date: Date): string {
  return date.toLocaleString("fr-MA", {
    weekday:  "long",
    day:      "numeric",
    month:    "long",
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: "Africa/Casablanca",
  });
}
