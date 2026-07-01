import { db, bookingsTable, servicesTable, staffTable, providersTable, usersTable } from "@workspace/db";
import { and, eq, gte, lt } from "drizzle-orm";
import { logger } from "./logger";
import { redis } from "./redis";
import { sendMail } from "./email";
import { sendSms } from "./sms";
import { buildReminderEmail, buildReminder2hEmail } from "./email-templates";

const REMINDER_DAY_TTL  = 60 * 60 * 48;
const REMINDER_2H_TTL   = 60 * 60 * 6;

async function fetchUpcomingBookings(from: Date, to: Date) {
  return db
    .select({
      id:              bookingsTable.id,
      startDatetime:   bookingsTable.startDatetime,
      amountCents:     bookingsTable.amountCents,
      clientName:      usersTable.name,
      clientEmail:     usersTable.email,
      clientPhone:     usersTable.phone,
      serviceName:     servicesTable.name,
      durationMinutes: servicesTable.durationMinutes,
      staffName:       staffTable.name,
      providerName:    providersTable.name,
      providerAddress: providersTable.address,
      providerCity:    providersTable.city,
      providerPhone:   providersTable.phone,
    })
    .from(bookingsTable)
    .innerJoin(usersTable,    eq(bookingsTable.clientId,   usersTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId,  servicesTable.id))
    .innerJoin(staffTable,    eq(bookingsTable.staffId,    staffTable.id))
    .innerJoin(providersTable,eq(bookingsTable.providerId, providersTable.id))
    .where(
      and(
        eq(bookingsTable.status, "CONFIRMED"),
        gte(bookingsTable.startDatetime, from),
        lt(bookingsTable.startDatetime, to),
      ),
    );
}

async function alreadySent(key: string): Promise<boolean> {
  if (!redis) return false;
  const v = await redis.get(key);
  return v === "1";
}

async function markSent(key: string, ttl: number): Promise<void> {
  if (!redis) return;
  await redis.set(key, "1", "EX", ttl);
}

async function runReminderScan() {
  const now = new Date();

  const dayFrom = new Date(now.getTime() + 22 * 3600_000);
  const dayTo   = new Date(now.getTime() + 26 * 3600_000);
  const dayBookings = await fetchUpcomingBookings(dayFrom, dayTo);

  for (const b of dayBookings) {
    const key = `reminder:day:${b.id}`;
    if (await alreadySent(key)) continue;

    const data = {
      bookingId: b.id, startDatetime: b.startDatetime, amountCents: b.amountCents,
      clientName: b.clientName, clientEmail: b.clientEmail,
      serviceName: b.serviceName, durationMinutes: b.durationMinutes,
      staffName: b.staffName, providerName: b.providerName,
      providerAddress: b.providerAddress, providerCity: b.providerCity,
      providerPhone: b.providerPhone,
    };

    const { subject, html } = buildReminderEmail(data);
    await sendMail({ to: b.clientEmail, subject, html });

    if (b.clientPhone) {
      await sendSms(
        b.clientPhone,
        `Rappel PSTAGEV1 : votre RDV "${b.serviceName}" chez ${b.providerName} est demain. Ref : ${b.id.split("-")[0].toUpperCase()}`,
      );
    }

    await markSent(key, REMINDER_DAY_TTL);
    logger.info({ bookingId: b.id, window: "J-1" }, "Reminder sent");
  }

  const h2From = new Date(now.getTime() + 1 * 3600_000);
  const h2To   = new Date(now.getTime() + 3 * 3600_000);
  const h2Bookings = await fetchUpcomingBookings(h2From, h2To);

  for (const b of h2Bookings) {
    const key = `reminder:2h:${b.id}`;
    if (await alreadySent(key)) continue;

    const data = {
      bookingId: b.id, startDatetime: b.startDatetime, amountCents: b.amountCents,
      clientName: b.clientName, clientEmail: b.clientEmail,
      serviceName: b.serviceName, durationMinutes: b.durationMinutes,
      staffName: b.staffName, providerName: b.providerName,
      providerAddress: b.providerAddress, providerCity: b.providerCity,
      providerPhone: b.providerPhone,
    };

    const { subject, html } = buildReminder2hEmail(data);
    await sendMail({ to: b.clientEmail, subject, html });

    if (b.clientPhone) {
      await sendSms(
        b.clientPhone,
        `PSTAGEV1 : votre RDV "${b.serviceName}" chez ${b.providerName} est dans 2h. Adresse : ${b.providerAddress ?? b.providerCity}`,
      );
    }

    await markSent(key, REMINDER_2H_TTL);
    logger.info({ bookingId: b.id, window: "H-2" }, "Reminder sent");
  }
}

export async function startReminderCron(): Promise<void> {
  if (redis) {
    try {
      const { Queue, Worker } = await import("bullmq");

      new Worker("reminder-cron", async () => { await runReminderScan(); }, {
        connection: redis as any,
        removeOnComplete: { count: 0 },
        removeOnFail: { count: 10 },
      });

      const queue = new Queue("reminder-cron", { connection: redis as any });
      const existing = await queue.getRepeatableJobs();
      for (const job of existing) await queue.removeRepeatableByKey(job.key);
      await queue.add("scan", {}, { repeat: { every: 60 * 60 * 1000 } });

      logger.info("Reminder cron started (BullMQ — every 60 min)");
      return;
    } catch (err) {
      logger.warn({ err }, "BullMQ reminder cron failed — falling back to setInterval");
    }
  }

  await runReminderScan();
  setInterval(() => runReminderScan().catch((err) => logger.error({ err }, "Reminder scan failed")), 60 * 60 * 1000);
  logger.info("Reminder cron started (setInterval fallback)");
}
