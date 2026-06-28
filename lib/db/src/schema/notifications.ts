import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { providersTable } from "./providers";

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: text("provider_id")
    .notNull()
    .references(() => providersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;
