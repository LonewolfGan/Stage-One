import { db } from "@workspace/db";
import {
  businessHoursTable,
  scheduleBlocksTable,
  bookingsTable,
  staffTable,
  servicesTable,
} from "@workspace/db";
import { eq, and, or, lt, gt, lte, gte, inArray } from "drizzle-orm";

export interface Slot {
  startTime: string;
  endTime: string;
  startDatetime: Date;
  endDatetime: Date;
  staffId: string;
  staffName: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots(
  providerId: string,
  serviceId: string,
  date: string,
  staffId?: string,
): Promise<Slot[]> {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getUTCDay();
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const service = await db.query.servicesTable.findFirst({
    where: and(eq(servicesTable.id, serviceId), eq(servicesTable.providerId, providerId)),
  });
  if (!service || !service.isActive) return [];

  const totalMinutes = service.durationMinutes + service.bufferMinutes;

  const staffQuery = db.query.staffTable.findMany({
    where: and(
      eq(staffTable.providerId, providerId),
      eq(staffTable.isActive, true),
      staffId ? eq(staffTable.id, staffId) : undefined,
    ),
  });

  const hoursQuery = db.query.businessHoursTable.findMany({
    where: and(
      eq(businessHoursTable.providerId, providerId),
      eq(businessHoursTable.dayOfWeek, dayOfWeek),
    ),
  });

  const blocksQuery = db.query.scheduleBlocksTable.findMany({
    where: and(
      eq(scheduleBlocksTable.providerId, providerId),
      lt(scheduleBlocksTable.startDatetime, dayEnd),
      gt(scheduleBlocksTable.endDatetime, dayStart),
    ),
  });

  const bookingsQuery = db.query.bookingsTable.findMany({
    where: and(
      eq(bookingsTable.providerId, providerId),
      inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      lt(bookingsTable.startDatetime, dayEnd),
      gt(bookingsTable.endDatetime, dayStart),
    ),
  });

  const [staffList, hours, blocks, existingBookings] = await Promise.all([
    staffQuery,
    hoursQuery,
    blocksQuery,
    bookingsQuery,
  ]);

  const providerHours = hours.find((h) => !h.isClosed);
  if (!providerHours) return [];

  const openMin = timeToMinutes(providerHours.openTime);
  const closeMin = timeToMinutes(providerHours.closeTime);

  const slots: Slot[] = [];

  for (const staff of staffList) {
    const staffBlocks = blocks.filter(
      (b) => b.staffId === null || b.staffId === staff.id,
    );
    const staffBookings = existingBookings.filter((b) => b.staffId === staff.id);

    for (let minute = openMin; minute + totalMinutes <= closeMin; minute += totalMinutes) {
      const slotStartMin = minute;
      const slotEndMin = minute + service.durationMinutes;

      const slotStart = new Date(`${date}T${minutesToTime(slotStartMin)}:00.000Z`);
      const slotEnd = new Date(`${date}T${minutesToTime(slotEndMin)}:00.000Z`);
      const slotEndWithBuffer = new Date(`${date}T${minutesToTime(slotStartMin + totalMinutes)}:00.000Z`);

      const blockedByBlock = staffBlocks.some((b) =>
        overlaps(slotStart, slotEndWithBuffer, b.startDatetime, b.endDatetime),
      );
      if (blockedByBlock) continue;

      const blockedByBooking = staffBookings.some((b) =>
        overlaps(slotStart, slotEnd, b.startDatetime, b.endDatetime),
      );
      if (blockedByBooking) continue;

      slots.push({
        startTime: minutesToTime(slotStartMin),
        endTime: minutesToTime(slotEndMin),
        startDatetime: slotStart,
        endDatetime: slotEnd,
        staffId: staff.id,
        staffName: staff.name,
      });
    }
  }

  return slots;
}
