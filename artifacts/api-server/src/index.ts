import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";
import { startBookingExpiryJob } from "./lib/booking-expiry";
import { startEmailWorker } from "./lib/email-worker";
import { setupPostgis } from "./lib/postgis-setup";
import { db, providersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function autoSeedIfEmpty() {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(providersTable);
    if (Number(count) === 0) {
      logger.info("Base vide — lancement du seed automatique…");
      const { runSeed } = await import("./scripts/seed");
      await runSeed();
      logger.info("Seed terminé avec succès");
    }
  } catch (err) {
    logger.warn({ err }, "Auto-seed non bloquant — ignoré");
  }
}

const httpServer = createServer(app);
initSocket(httpServer);

setupPostgis().then(() => {
  startBookingExpiryJob();
}).catch(() => {
  startBookingExpiryJob();
});

autoSeedIfEmpty().then(() => {
  httpServer.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
});

startEmailWorker();
