import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";

export const businessHoursTable = pgTable("business_hours", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providersTable.id),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  isClosed: boolean("is_closed").notNull().default(false),
});

export const insertBusinessHoursSchema = createInsertSchema(businessHoursTable).omit({
  id: true,
});
export const selectBusinessHoursSchema = createSelectSchema(businessHoursTable);
export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
export type BusinessHours = typeof businessHoursTable.$inferSelect;
