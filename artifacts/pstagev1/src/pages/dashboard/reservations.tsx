import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isToday,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

/* ── Types ── */
interface WeekBooking {
  id: string;
  clientName: string;
  service: string;
  startHour: number; // e.g. 9.0 = 09:00, 9.5 = 09:30
  durationH: number; // in hours, e.g. 1.5
  dayIndex: number;  // 0=Mon … 6=Sun
  color: string;
  staff: string;
  amount: number;
  status: "confirmed" | "pending" | "cancelled";
}

/* ── Mock data — 7 jours à partir du lundi courant ── */
const WEEK_BOOKINGS: WeekBooking[] = [
  { id: "w1",  clientName: "Yasmine Alaoui",   service: "Coupe + Brushing",    startHour: 9,    durationH: 1.5, dayIndex: 0, color: "#D4466E", staff: "Salma B.",   amount: 250, status: "confirmed" },
  { id: "w2",  clientName: "Sara Benali",      service: "Soin kératine",       startHour: 11,   durationH: 1.5, dayIndex: 0, color: "#06B6D4", staff: "Nour A.",    amount: 480, status: "confirmed" },
  { id: "w3",  clientName: "Nadia Fassi",      service: "Coloration racines",  startHour: 14,   durationH: 1,   dayIndex: 0, color: "#8B5CF6", staff: "Salma B.",   amount: 320, status: "pending"   },
  { id: "w4",  clientName: "Kenza Moussaoui",  service: "Manucure gel",        startHour: 15.5, durationH: 1,   dayIndex: 0, color: "#E8A33D", staff: "Ines M.",    amount: 180, status: "confirmed" },
  { id: "w5",  clientName: "Leila Bouzid",     service: "Massage détente",     startHour: 17,   durationH: 1,   dayIndex: 0, color: "#10B981", staff: "Nour A.",    amount: 350, status: "confirmed" },
  { id: "w6",  clientName: "Rim Chraibi",      service: "Brushing",            startHour: 10,   durationH: 1,   dayIndex: 1, color: "#D4466E", staff: "Salma B.",   amount: 150, status: "confirmed" },
  { id: "w7",  clientName: "Hana El Ouafi",    service: "Soin visage",         startHour: 13,   durationH: 1.5, dayIndex: 1, color: "#06B6D4", staff: "Ines M.",    amount: 280, status: "confirmed" },
  { id: "w8",  clientName: "Dounia Tazi",      service: "Épilation complète",  startHour: 16,   durationH: 1,   dayIndex: 1, color: "#F97316", staff: "Nour A.",    amount: 200, status: "pending"   },
  { id: "w9",  clientName: "Meryem Hajji",     service: "Lissage brésilien",   startHour: 9.5,  durationH: 2,   dayIndex: 2, color: "#8B5CF6", staff: "Salma B.",   amount: 550, status: "confirmed" },
  { id: "w10", clientName: "Soumia Rhazi",     service: "Manucure + Pédicure", startHour: 12,   durationH: 1.5, dayIndex: 2, color: "#E8A33D", staff: "Ines M.",    amount: 220, status: "confirmed" },
  { id: "w11", clientName: "Fatima Zahra",     service: "Coloration totale",   startHour: 15,   durationH: 2,   dayIndex: 2, color: "#D4466E", staff: "Nour A.",    amount: 450, status: "confirmed" },
  { id: "w12", clientName: "Asmaa Berrada",    service: "Coupe femme",         startHour: 10.5, durationH: 1,   dayIndex: 3, color: "#10B981", staff: "Salma B.",   amount: 180, status: "confirmed" },
  { id: "w13", clientName: "Zineb Lahlou",     service: "Soin kératine",       startHour: 14.5, durationH: 1.5, dayIndex: 3, color: "#06B6D4", staff: "Nour A.",    amount: 480, status: "pending"   },
  { id: "w14", clientName: "Houda Mansouri",   service: "Épilation sourcils",  startHour: 9,    durationH: 0.5, dayIndex: 4, color: "#F97316", staff: "Ines M.",    amount: 60,  status: "confirmed" },
  { id: "w15", clientName: "Sanaa El Alami",   service: "Brushing + Coupe",    startHour: 11,   durationH: 1.5, dayIndex: 4, color: "#D4466E", staff: "Salma B.",   amount: 250, status: "confirmed" },
  { id: "w16", clientName: "Naima Idrissi",    service: "Manucure gel",        startHour: 15,   durationH: 1,   dayIndex: 4, color: "#E8A33D", staff: "Ines M.",    amount: 180, status: "confirmed" },
  { id: "w17", clientName: "Lamiae Sqalli",    service: "Massage dos",         startHour: 10,   durationH: 1,   dayIndex: 5, color: "#10B981", staff: "Nour A.",    amount: 300, status: "confirmed" },
  { id: "w18", clientName: "Ghizlane Amrani",  service: "Soin visage",         startHour: 13,   durationH: 1,   dayIndex: 5, color: "#06B6D4", staff: "Ines M.",    amount: 280, status: "confirmed" },
];

/* ── Constants ── */
const HOUR_START = 8;
const HOUR_END   = 20;
const TOTAL_H    = HOUR_END - HOUR_START;
const SLOT_PX    = 64; // pixels per hour
const GRID_H     = TOTAL_H * SLOT_PX;
const LABEL_W    = 48;

const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = Array.from({ length: TOTAL_H + 1 }, (_, i) => HOUR_START + i);

/* ── Color tint helper (20% opacity bg, full color text/border) ── */
function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── Booking block component ── */
function BookingBlock({
  booking,
  colW,
}: {
  booking: WeekBooking;
  colW: number;
}) {
  const [hovered, setHovered] = useState(false);
  const top     = (booking.startHour - HOUR_START) * SLOT_PX;
  const height  = Math.max(booking.durationH * SLOT_PX - 4, 28);
  const isShort = height < 52;

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
        left: 3,
        right: 3,
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
            {`${Math.floor(booking.startHour)}:${String((booking.startHour % 1) * 60).padStart(2, "0")} – ${Math.floor(booking.startHour + booking.durationH)}:${String(((booking.startHour + booking.durationH) % 1) * 60).padStart(2, "0")}`}
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

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monday = addWeeks(baseMonday, weekOffset);
  const days   = eachDayOfInterval({ start: monday, end: addDays(monday, 6) });

  const weekLabel = (() => {
    const start = format(monday, "d MMM", { locale: fr });
    const end   = format(addDays(monday, 6), "d MMM yyyy", { locale: fr });
    return `${start} – ${end}`;
  })();

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
          justifyContent: "flex-end",
        }}>
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
              {/* empty corner */}
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
                const colBookings = WEEK_BOOKINGS.filter((b) => b.dayIndex === colIdx);
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

                    {/* Booking blocks */}
                    {colBookings.map((b) => (
                      <BookingBlock key={b.id} booking={b} colW={120} />
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
