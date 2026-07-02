import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["CLIENT", "OWNER", "ADMIN"]);
export const providerTypeEnum = pgEnum("provider_type", ["ESTABLISHMENT", "INDIVIDUAL"]);
export const providerStatusEnum = pgEnum("provider_status", ["PENDING", "ACTIVE", "SUSPENDED"]);
export const blockTypeEnum = pgEnum("block_type", ["HOLIDAY", "MANUAL_BLOCK", "ABSENCE", "VACATION", "BREAK"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "EXPIRED",
]);
export const planEnum = pgEnum("plan", ["FREE", "PRO", "BUSINESS"]);
