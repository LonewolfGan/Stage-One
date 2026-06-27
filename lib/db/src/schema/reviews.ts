import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";
import { bookingsTable } from "./bookings";
import { usersTable } from "./users";

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providersTable.id),
  bookingId: text("booking_id")
    .notNull()
    .unique()
    .references(() => bookingsTable.id),
  clientId: text("client_id")
    .notNull()
    .references(() => usersTable.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reply: text("reply"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});
export const selectReviewSchema = createSelectSchema(reviewsTable);
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
