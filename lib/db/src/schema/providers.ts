import { pgTable, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providerTypeEnum, providerStatusEnum } from "./enums";
import { usersTable } from "./users";

export const providersTable = pgTable("providers", {
  id: text("id").primaryKey(),
  type: providerTypeEnum("type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  city: text("city").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  logoUrl: text("logo_url"),
  status: providerStatusEnum("status").notNull().default("PENDING"),
  ownerId: text("owner_id")
    .notNull()
    .unique()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectProviderSchema = createSelectSchema(providersTable);
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
