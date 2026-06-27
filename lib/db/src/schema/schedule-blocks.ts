import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { blockTypeEnum } from "./enums";
import { providersTable } from "./providers";
import { staffTable } from "./staff";

export const scheduleBlocksTable = pgTable("schedule_blocks", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providersTable.id),
  staffId: text("staff_id").references(() => staffTable.id),
  type: blockTypeEnum("type").notNull(),
  title: text("title"),
  startDatetime: timestamp("start_datetime", { withTimezone: true }).notNull(),
  endDatetime: timestamp("end_datetime", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScheduleBlockSchema = createInsertSchema(scheduleBlocksTable).omit({
  id: true,
  createdAt: true,
});
export const selectScheduleBlockSchema = createSelectSchema(scheduleBlocksTable);
export type InsertScheduleBlock = z.infer<typeof insertScheduleBlockSchema>;
export type ScheduleBlock = typeof scheduleBlocksTable.$inferSelect;
