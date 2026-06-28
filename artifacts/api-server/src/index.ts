import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";
import { startBookingExpiryJob } from "./lib/booking-expiry";
import { startEmailWorker } from "./lib/email-worker";
import { setupPostgis } from "./lib/postgis-setup";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
initSocket(httpServer);

setupPostgis().then(() => {
  startBookingExpiryJob();
}).catch(() => {
  startBookingExpiryJob();
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});

startEmailWorker();
