import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingStatusEnum } from "./enums";
import { providersTable } from "./providers";
import { servicesTable } from "./services";
import { staffTable } from "./staff";
import { usersTable } from "./users";

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providersTable.id),
  serviceId: text("service_id")
    .notNull()
    .references(() => servicesTable.id),
  staffId: text("staff_id")
    .notNull()
    .references(() => staffTable.id),
  clientId: text("client_id")
    .notNull()
    .references(() => usersTable.id),
  startDatetime: timestamp("start_datetime", { withTimezone: true }).notNull(),
  endDatetime: timestamp("end_datetime", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status"),
  amountCents: integer("amount_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectBookingSchema = createSelectSchema(bookingsTable);
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
