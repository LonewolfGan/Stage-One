import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import {
  format,
  addWeeks,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

/* ── API response types ── */
interface ApiBooking {
  id: string;
  startDatetime: string;
  endDatetime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "EXPIRED";
  amountCents: number;
  service: { id: string; name: string; durationMinutes: number } | null;
  staff:   { id: string; name: string } | null;
  client:  { id: string; name: string } | null;
}

/* ── Internal view type ── */
interface WeekBooking {
  id: string;
  clientName: string;
  service: string;
  startHour: number;
  durationH: number;
  dayIndex: number;
  color: string;
  staff: string;
  amount: number;
  status: "confirmed" | "pending" | "cancelled";
}

/* ── Constants ── */
const HOUR_START = 8;
const HOUR_END   = 20;
const TOTAL_H    = HOUR_END - HOUR_START;
const SLOT_PX    = 64;
const GRID_H     = TOTAL_H * SLOT_PX;
const LABEL_W    = 48;

const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = Array.from({ length: TOTAL_H + 1 }, (_, i) => HOUR_START + i);

const STAFF_COLORS = ["#D4466E", "#06B6D4", "#8B5CF6", "#E8A33D", "#10B981", "#F97316"];

/* ── Helpers ── */
function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function staffColor(staffId: string): string {
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) hash = staffId.charCodeAt(i) + ((hash << 5) - hash);
  return STAFF_COLORS[Math.abs(hash) % STAFF_COLORS.length];
}

function mapStatus(s: ApiBooking["status"]): WeekBooking["status"] {
  if (s === "CONFIRMED" || s === "COMPLETED") return "confirmed";
  if (s === "CANCELLED" || s === "EXPIRED")  return "cancelled";
  return "pending";
}

function toWeekBooking(b: ApiBooking, dayIndex: number): WeekBooking {
  const start = new Date(b.startDatetime);
  const startHour = start.getUTCHours() + start.getUTCMinutes() / 60;
  const durationH = b.service ? b.service.durationMinutes / 60 : 1;
  return {
    id: b.id,
    clientName: b.client?.name ?? "—",
    service: b.service?.name ?? "—",
    startHour,
    durationH,
    dayIndex,
    color: staffColor(b.staff?.id ?? b.id),
    staff: b.staff?.name ?? "—",
    amount: b.amountCents / 100,
    status: mapStatus(b.status),
  };
}

/* ── Lane assignment — places overlapping bookings side-by-side ── */
interface LaidOut extends WeekBooking {
  lane: number;
  laneCount: number;
}

function computeLanes(bookings: WeekBooking[]): LaidOut[] {
  if (bookings.length === 0) return [];

  const sorted = [...bookings].sort((a, b) => a.startHour - b.startHour);

  // Assign each booking a lane (the first lane whose last endHour <= this startHour)
  const laneEnds: number[] = [];
  const lanes: number[] = sorted.map((b) => {
    const end = b.startHour + b.durationH;
    const free = laneEnds.findIndex((e) => e <= b.startHour);
    if (free !== -1) { laneEnds[free] = end; return free; }
    laneEnds.push(end);
    return laneEnds.length - 1;
  });

  const withLane = sorted.map((b, i) => ({ ...b, lane: lanes[i] }));

  // For each booking compute laneCount = max lane of all overlapping bookings + 1
  return withLane.map((b) => {
    const bEnd = b.startHour + b.durationH;
    const overlap = withLane.filter(
      (o) => o.startHour < bEnd && o.startHour + o.durationH > b.startHour,
    );
    const laneCount = Math.max(...overlap.map((o) => o.lane)) + 1;
    return { ...b, laneCount };
  });
}

/* ── Booking block component ── */
function BookingBlock({ booking }: { booking: LaidOut }) {
  const [hovered, setHovered] = useState(false);
  const top    = (booking.startHour - HOUR_START) * SLOT_PX;
  const height = Math.max(booking.durationH * SLOT_PX - 4, 28);
  const isShort = height < 52;

  const pct   = 100 / booking.laneCount;
  const left  = `calc(${booking.lane * pct}% + 2px)`;
  const right = `calc(${(booking.laneCount - booking.lane - 1) * pct}% + 2px)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        top: top + 2,
        left,
        right,
        height,
        borderRadius: 8,
        backgroundColor: hovered
          ? hexAlpha(booking.color, 0.22)
          : hexAlpha(booking.color, 0.13),
        padding: isShort ? "4px 8px" : "7px 9px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "background-color 140ms",
        zIndex: 1,
      }}
    >
      {!isShort && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <Clock size={9} color={booking.color} strokeWidth={2.5} />
          <span style={{ fontSize: 10, fontWeight: 600, color: booking.color, letterSpacing: "0.01em" }}>
            {`${Math.floor(booking.startHour)}:${String(Math.round((booking.startHour % 1) * 60)).padStart(2, "0")} – ${Math.floor(booking.startHour + booking.durationH)}:${String(Math.round(((booking.startHour + booking.durationH) % 1) * 60)).padStart(2, "0")}`}
          </span>
        </div>
      )}
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--ink)",
        margin: 0,
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {booking.service}
      </p>
      {!isShort && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <User size={9} color="var(--ink-tertiary)" strokeWidth={2} />
          <span style={{ fontSize: 10, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {booking.clientName}
          </span>
        </div>
      )}
      {booking.status === "pending" && (
        <div style={{
          position: "absolute",
          top: 5,
          right: 6,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "#E8A33D",
        }} />
      )}
    </motion.div>
  );
}

/* ── Main page ── */
export default function ReservationsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [, navigate] = useLocation();

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monday = addWeeks(baseMonday, weekOffset);
  const days   = eachDayOfInterval({ start: monday, end: addDays(monday, 6) });

  const weekLabel = (() => {
    const start = format(monday, "d MMM", { locale: fr });
    const end   = format(addDays(monday, 6), "d MMM yyyy", { locale: fr });
    return `${start} – ${end}`;
  })();

  /* ── Fetch all 7 days in parallel ── */
  const { data: weekBookings = [], isLoading } = useQuery<WeekBooking[]>({
    queryKey: ["dashboard-week-bookings", weekOffset],
    queryFn: async () => {
      const results = await Promise.all(
        days.map((day, dayIndex) => {
          const dateStr = format(day, "yyyy-MM-dd");
          return api
            .get<ApiBooking[]>(`/dashboard/bookings?date=${dateStr}`)
            .then((list) => list.map((b) => toWeekBooking(b, dayIndex)))
            .catch(() => [] as WeekBooking[]);
        }),
      );
      return results.flat();
    },
    staleTime: 30_000,
  });

  return (
    <DashboardLayout title="Réservations" breadcrumb="Agenda" noPadding>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Week navigator bar ── */}
        <div style={{
          flexShrink: 0,
          padding: "12px 28px",
          borderBottom: "1px solid var(--hairline)",
          backgroundColor: "var(--canvas-pure)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/agenda")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px 0 8px",
              borderRadius: 9,
              border: "1px solid var(--hairline)",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-secondary)",
              letterSpacing: "-0.01em",
              transition: "background 120ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Agenda
          </button>

          {/* Week navigator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", minWidth: 160, textAlign: "center" }}>
              {isLoading ? (
                <span style={{ display: "inline-block", width: 140, height: 14, borderRadius: 6, background: "var(--surface-3)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : weekLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <ChevronRight size={15} />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                style={{ height: 32, padding: "0 12px", borderRadius: 9, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", transition: "background 120ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        {/* ── Week grid (scrollable) ── */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", backgroundColor: "var(--canvas)" }}>
          <div style={{ minWidth: 640 }}>

            {/* Day headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "var(--canvas-pure)",
              borderBottom: "1px solid var(--hairline)",
            }}>
              <div style={{ borderRight: "1px solid var(--hairline)" }} />
              {days.map((day, i) => {
                const active = isToday(day);
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px 0 9px",
                      textAlign: "center",
                      borderRight: i < 6 ? "1px solid var(--hairline)" : "none",
                      backgroundColor: active ? "var(--accent-tint)" : "transparent",
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: active ? "var(--accent)" : "var(--ink-tertiary)", margin: "0 0 3px" }}>
                      {DAY_SHORT[i]}
                    </p>
                    <p style={{
                      fontSize: 19,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      color: active ? "var(--accent)" : "var(--ink)",
                      margin: 0,
                      lineHeight: 1,
                    }}>
                      {format(day, "d")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
              position: "relative",
            }}>

              {/* Hour labels column */}
              <div style={{ borderRight: "1px solid var(--hairline)", position: "relative", height: GRID_H }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      top: (h - HOUR_START) * SLOT_PX - 8,
                      right: 8,
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--ink-tertiary)",
                      lineHeight: 1,
                      userSelect: "none",
                    }}
                  >
                    {h < 10 ? `0${h}:00` : `${h}:00`}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, colIdx) => {
                const colBookings = computeLanes(weekBookings.filter((b) => b.dayIndex === colIdx));
                const active = isToday(day);
                return (
                  <div
                    key={colIdx}
                    style={{
                      position: "relative",
                      height: GRID_H,
                      borderRight: colIdx < 6 ? "1px solid var(--hairline)" : "none",
                      backgroundColor: active ? hexAlpha("#D4466E", 0.02) : "transparent",
                    }}
                  >
                    {/* Hour guide lines */}
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        style={{
                          position: "absolute",
                          top: (h - HOUR_START) * SLOT_PX,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: h === HOUR_START ? "transparent" : "var(--hairline)",
                        }}
                      />
                    ))}

                    {/* Half-hour lines */}
                    {HOURS.slice(0, -1).map((h) => (
                      <div
                        key={`${h}-half`}
                        style={{
                          position: "absolute",
                          top: (h - HOUR_START) * SLOT_PX + SLOT_PX / 2,
                          left: 8,
                          right: 8,
                          height: 1,
                          backgroundColor: "var(--hairline)",
                          opacity: 0.5,
                        }}
                      />
                    ))}

                    {/* Skeleton while loading */}
                    {isLoading && colIdx === 0 && (
                      <div style={{
                        position: "absolute",
                        top: 2 * SLOT_PX,
                        left: 3,
                        right: 3,
                        height: SLOT_PX - 4,
                        borderRadius: 8,
                        background: "var(--surface-3)",
                        opacity: 0.5,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }} />
                    )}

                    {/* Booking blocks */}
                    {!isLoading && colBookings.map((b) => (
                      <BookingBlock key={b.id} booking={b} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
