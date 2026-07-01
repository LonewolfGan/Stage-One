import { db, bookingsTable, servicesTable, staffTable, providersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { redis } from "./redis";
import { sendMail } from "./email";
import { buildConfirmationEmail, buildReminderEmail, type BookingEmailData } from "./email-templates";

export type EmailJobType = "booking_confirmation" | "booking_reminder";

export interface EmailJobPayload {
  type: EmailJobType;
  bookingId: string;
}

async function fetchBookingEmailData(bookingId: string): Promise<BookingEmailData | null> {
  const [row] = await db
    .select({
      id: bookingsTable.id,
      startDatetime: bookingsTable.startDatetime,
      amountCents: bookingsTable.amountCents,
      clientName: usersTable.name,
      clientEmail: usersTable.email,
      serviceName: servicesTable.name,
      durationMinutes: servicesTable.durationMinutes,
      staffName: staffTable.name,
      providerName: providersTable.name,
      providerAddress: providersTable.address,
      providerCity: providersTable.city,
      providerPhone: providersTable.phone,
    })
    .from(bookingsTable)
    .innerJoin(usersTable, eq(bookingsTable.clientId, usersTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
    .innerJoin(providersTable, eq(bookingsTable.providerId, providersTable.id))
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!row) return null;

  return {
    bookingId,
    startDatetime: row.startDatetime,
    amountCents: row.amountCents,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    serviceName: row.serviceName,
    durationMinutes: row.durationMinutes,
    staffName: row.staffName,
    providerName: row.providerName,
    providerAddress: row.providerAddress,
    providerCity: row.providerCity,
    providerPhone: row.providerPhone,
  };
}

async function processEmailJob(payload: EmailJobPayload): Promise<void> {
  const data = await fetchBookingEmailData(payload.bookingId);
  if (!data) {
    logger.warn({ bookingId: payload.bookingId }, "Email job: booking not found, skipping");
    return;
  }

  const { subject, html } =
    payload.type === "booking_confirmation"
      ? buildConfirmationEmail(data)
      : buildReminderEmail(data);

  await sendMail({ to: data.clientEmail, subject, html });
  logger.info({ type: payload.type, bookingId: payload.bookingId, to: data.clientEmail }, "Email job processed");
}

let emailQueue: import("bullmq").Queue | null = null;

export async function enqueueEmailJob(payload: EmailJobPayload, delayMs = 0): Promise<void> {
  if (emailQueue) {
    await emailQueue.add(payload.type, payload, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    });
    logger.info({ type: payload.type, bookingId: payload.bookingId, delayMs }, "Email job enqueued (BullMQ)");
    return;
  }

  // Fallback: setTimeout when Redis/BullMQ is not configured
  if (delayMs > 0) {
    setTimeout(() => processEmailJob(payload).catch((err) => logger.error({ err }, "Email fallback job failed")), delayMs);
  } else {
    processEmailJob(payload).catch((err) => logger.error({ err }, "Email fallback job failed"));
  }
  logger.info({ type: payload.type, bookingId: payload.bookingId, delayMs }, "Email job scheduled (setTimeout fallback)");
}

export async function startEmailWorker(): Promise<void> {
  if (!redis) {
    logger.warn("REDIS_URL not set — email worker running in setTimeout fallback mode");
    return;
  }

  try {
    const { Queue, Worker } = await import("bullmq");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emailQueue = new Queue("email-notifications", {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: redis as any,
      defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
    });

    new Worker<EmailJobPayload>(
      "email-notifications",
      async (job) => {
        await processEmailJob(job.data);
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection: redis as any,
        concurrency: 5,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    );

    logger.info("Email worker started (BullMQ + Redis)");
  } catch (err) {
    logger.error({ err }, "Email worker failed to start — falling back to setTimeout mode");
    emailQueue = null;
  }
}
