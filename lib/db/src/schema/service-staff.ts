import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";
import { servicesTable } from "./services";
import { staffTable } from "./staff";

export const serviceStaffTable = pgTable(
  "service_staff",
  {
    serviceId: text("service_id")
      .notNull()
      .references(() => servicesTable.id),
    staffId: text("staff_id")
      .notNull()
      .references(() => staffTable.id),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.staffId] })],
);

export type ServiceStaff = typeof serviceStaffTable.$inferSelect;
