import { useState } from "react";
import { useLocation } from "wouter";
import { useQueries } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import {
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

/* ── Types ── */
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

interface PlacedBooking extends WeekBooking {
  col: number;
  numCols: number;
}

/* ── Constants ── */
const HOUR_START = 8;
const HOUR_END   = 20;
const TOTAL_H    = HOUR_END - HOUR_START;
const SLOT_PX    = 72;
const GRID_H     = TOTAL_H * SLOT_PX;
const LABEL_W    = 52;

const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS     = Array.from({ length: TOTAL_H + 1 }, (_, i) => HOUR_START + i);

/* Heights of sticky elements above the day-header row */
const PAGE_HEADER_H  = 61;
const WEEK_NAV_H     = 57;
const DAY_HEADER_TOP = PAGE_HEADER_H + WEEK_NAV_H;

/* ── Color palette — deterministic per staff/client name ── */
const PALETTE = ["#D4466E", "#06B6D4", "#8B5CF6", "#10B981", "#F97316", "#E8A33D"];

function hashColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── Adapt raw API booking → WeekBooking ── */
function adaptBooking(b: any, dayIndex: number): WeekBooking {
  const start     = new Date(b.startDatetime);
  const end       = b.endDatetime ? new Date(b.endDatetime) : new Date(start.getTime() + 60 * 60_000);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const durationH = Math.max((end.getTime() - start.getTime()) / 3_600_000, 0.25);
  return {
    id:         b.id,
    clientName: b.client?.name ?? "Client",
    service:    b.service?.name ?? "Prestation",
    startHour,
    durationH,
    dayIndex,
    color:      hashColor(b.staff?.name ?? b.client?.name ?? b.id),
    staff:      b.staff?.name ?? "",
    amount:     Math.round((b.amountCents ?? 0) / 100),
    status:     b.status === "CONFIRMED" ? "confirmed"
              : b.status === "CANCELLED" ? "cancelled"
              : "pending",
  };
}

/* ── Sub-column layout for concurrent bookings in a single day column ── */
function layoutDayBookings(bookings: WeekBooking[]): PlacedBooking[] {
  if (bookings.length === 0) return [];

  const sorted = [...bookings].sort((a, b) => a.startHour - b.startHour);
  const occupied: Array<{ col: number; endHour: number }> = [];

  const withCols = sorted.map((b) => {
    const endHour     = b.startHour + b.durationH;
    const busyCols    = occupied.filter(o => o.endHour > b.startHour).map(o => o.col);
    let col = 0;
    while (busyCols.includes(col)) col++;
    occupied.push({ col, endHour });
    return { ...b, col };
  });

  return withCols.map((b) => {
    const concurrent = withCols.filter(
      o => o.startHour < b.startHour + b.durationH && o.startHour + o.durationH > b.startHour,
    );
    const numCols = concurrent.reduce((m, c) => Math.max(m, c.col + 1), 1);
    return { ...b, numCols };
  });
}

/* ── Booking block ── */
function BookingBlock({ booking }: { booking: PlacedBooking }) {
  const [hovered, setHovered] = useState(false);
  const top    = (booking.startHour - HOUR_START) * SLOT_PX;
  const height = Math.max(booking.durationH * SLOT_PX - 4, 28);
  const isShort = height < 56;

  const startH = Math.floor(booking.startHour);
  const startM = String(Math.round((booking.startHour % 1) * 60)).padStart(2, "0");
  const endDec = booking.startHour + booking.durationH;
  const endH   = Math.floor(endDec);
  const endM   = String(Math.round((endDec % 1) * 60)).padStart(2, "0");

  /* Sub-column geometry */
  const pct     = 100 / booking.numCols;
  const leftPct = booking.col * pct;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        top: top + 2,
        left:   `calc(${leftPct}% + 3px)`,
        width:  `calc(${pct}% - 6px)`,
        height,
        borderRadius: 8,
        backgroundColor: hovered ? hexAlpha(booking.color, 0.22) : hexAlpha(booking.color, 0.13),
        border: `1px solid ${hexAlpha(booking.color, 0.30)}`,
        padding: isShort ? "4px 8px" : "8px 10px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "background-color 140ms",
        zIndex: 1,
      }}
    >
      {!isShort && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          <Clock size={10} color={booking.color} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 600, color: booking.color, letterSpacing: "0.01em" }}>
            {startH}:{startM} – {endH}:{endM}
          </span>
        </div>
      )}
      <p style={{
        fontSize: 12,
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
          <User size={10} color="var(--ink-tertiary)" strokeWidth={2} />
          <span style={{ fontSize: 11, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {booking.clientName}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Main page ── */
export default function ReservationsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [, navigate] = useLocation();

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monday     = addWeeks(baseMonday, weekOffset);
  const days       = eachDayOfInterval({ start: monday, end: addDays(monday, 6) });

  const weekLabel = `${format(monday, "d MMM", { locale: fr })} – ${format(addDays(monday, 6), "d MMM yyyy", { locale: fr })}`;

  const dayQueries = useQueries({
    queries: days.map((day) => ({
      queryKey: ["dashboard", "bookings", format(day, "yyyy-MM-dd")],
      queryFn:  () => api.getDashboardBookings({ date: format(day, "yyyy-MM-dd") }),
      staleTime: 30_000,
    })),
  });

  const allBookings: WeekBooking[] = dayQueries.flatMap((q, dayIdx) => {
    if (!q.data) return [];
    return (q.data as any[]).map((b) => adaptBooking(b, dayIdx));
  });

  return (
    <DashboardLayout title="Réservations" breadcrumb="Agenda" noPadding>
      {/* Hide scrollbars globally for this page while keeping scroll functionality */}
      <style>{`
        .ds-dash-main { scrollbar-width: none; }
        .ds-dash-main::-webkit-scrollbar { display: none; }
        .rz-grid-x { scrollbar-width: none; }
        .rz-grid-x::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Week navigator — sticky below page header ── */}
      <div style={{
        position: "sticky",
        top: PAGE_HEADER_H,
        zIndex: 9,
        flexShrink: 0,
        padding: "12px 24px",
        borderBottom: "1px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/dashboard/agenda")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 32, padding: "0 12px 0 8px",
            borderRadius: 9, border: "1px solid var(--hairline)",
            background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)",
            transition: "background 120ms, color 120ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--ink)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--ink-secondary)"; }}
        >
          <ChevronLeft size={15} />
          Retour
        </button>

        {/* Week nav */}
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
            {weekLabel}
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

      {/* ── Week grid — single scroll via ds-dash-main ── */}
      <div className="rz-grid-x" style={{ backgroundColor: "var(--canvas)", overflowX: "auto" }}>
        <div style={{ minWidth: 640 }}>

          {/* Day headers — sticky below week nav */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
            position: "sticky",
            top: DAY_HEADER_TOP,
            zIndex: 8,
            backgroundColor: "var(--surface-1)",
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
                  <p style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.03em", color: active ? "var(--accent)" : "var(--ink)", margin: 0, lineHeight: 1 }}>
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`, position: "relative" }}>

            {/* Hour labels */}
            <div style={{ borderRight: "1px solid var(--hairline)", position: "relative", height: GRID_H, overflow: "hidden" }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: (h - HOUR_START) * SLOT_PX,
                    left: 0,
                    right: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    lineHeight: 1,
                    userSelect: "none",
                    textAlign: "right",
                    transform: h === HOUR_START ? "none" : "translateY(-50%)",
                  }}
                >
                  {h < 10 ? `0${h}:00` : `${h}:00`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, colIdx) => {
              const dayRaw      = allBookings.filter((b) => b.dayIndex === colIdx);
              const colBookings = layoutDayBookings(dayRaw);
              const active      = isToday(day);
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
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div key={h} style={{ position: "absolute", top: (h - HOUR_START) * SLOT_PX, left: 0, right: 0, height: 1, backgroundColor: h === HOUR_START ? "transparent" : "var(--hairline)" }} />
                  ))}
                  {/* Half-hour lines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div key={`${h}-h`} style={{ position: "absolute", top: (h - HOUR_START) * SLOT_PX + SLOT_PX / 2, left: 8, right: 8, height: 1, backgroundColor: "var(--hairline)", opacity: 0.4 }} />
                  ))}
                  {/* Booking blocks */}
                  {colBookings.map((b) => (
                    <BookingBlock key={b.id} booking={b} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
