import { useMemo } from "react";
import { format } from "date-fns";

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────
export interface WeekCalendarBooking {
  id: string;
  dayIndex: number; // 0–6
  start: number;    // heure décimale (ex: 9.5 = 09:30)
  end: number;
  title: string;
  client: string;
  type: string;
}

interface LaidOut extends WeekCalendarBooking {
  lane: number;
  totalLanes: number;
}

interface WeekCalendarProps {
  days: Date[];
  bookings: WeekCalendarBooking[];
  isLoading?: boolean;
}

// ────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END   = 19;
const HOURS      = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const SLOT_PX    = 64;
const GRID_H     = (HOUR_END - HOUR_START) * SLOT_PX;
const LABEL_W    = 56;
const DAY_SHORT  = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

const SERVICE_COLORS: Record<string, string> = {
  "coupe-homme": "#3B82F6",
  "coupe-femme": "#A855F7",
  coloration:    "#D4466E",
  soin:          "#10B981",
  default:       "#6B7280",
};

function getServiceColor(type: string): string {
  return SERVICE_COLORS[type] ?? SERVICE_COLORS.default;
}

// ────────────────────────────────────────────────
// UTILS
// ────────────────────────────────────────────────
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatHour(decimalHour: number): string {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  return `${h < 10 ? "0" + h : h}:${m === 0 ? "00" : m}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate()     === today.getDate()  &&
    date.getMonth()    === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Regroupe les réservations qui se chevauchent en clusters,
 * puis assigne à chacune une lane (colonne horizontale) + le nombre
 * total de lanes nécessaires pour SON cluster.
 */
function computeLanes(bookings: WeekCalendarBooking[]): LaidOut[] {
  if (bookings.length === 0) return [];

  const sorted = [...bookings].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  // 1. Regroupement en clusters de chevauchement
  const clusters: WeekCalendarBooking[][] = [];
  let current: WeekCalendarBooking[] = [];
  let clusterEnd = -Infinity;

  for (const b of sorted) {
    if (current.length === 0 || b.start < clusterEnd) {
      current.push(b);
      clusterEnd = Math.max(clusterEnd, b.end);
    } else {
      clusters.push(current);
      current = [b];
      clusterEnd = b.end;
    }
  }
  if (current.length) clusters.push(current);

  // 2. Attribution des lanes par cluster (algo glouton)
  const result: LaidOut[] = [];

  for (const cluster of clusters) {
    const lanes: number[] = [];

    const positioned = cluster.map((b) => {
      let laneIndex = lanes.findIndex((endTime) => endTime <= b.start);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(b.end);
      } else {
        lanes[laneIndex] = b.end;
      }
      return { ...b, lane: laneIndex };
    });

    const totalLanes = lanes.length;
    positioned.forEach((b) => result.push({ ...b, totalLanes }));
  }

  return result;
}

// ────────────────────────────────────────────────
// BOOKING BLOCK
// ────────────────────────────────────────────────
function BookingBlock({ booking }: { booking: LaidOut }) {
  const { start, end, lane, totalLanes, title, client, type } = booking;
  const color = getServiceColor(type);

  const top    = (start - HOUR_START) * SLOT_PX;
  const height = Math.max((end - start) * SLOT_PX - 4, 22);

  const GUTTER   = 3;
  const GAP      = 3;
  const widthPct = 100 / totalLanes;

  const isNarrow     = totalLanes >= 3;
  const isVeryNarrow = totalLanes >= 4;
  const isShort      = height < 46;
  const isTiny       = height < 30;

  const timeLabel = `${formatHour(start)} – ${formatHour(end)}`;

  return (
    <div
      style={{
        position: "absolute",
        top: top + 2,
        height,
        left:  `calc(${GUTTER}px + ${lane * widthPct}% + ${lane > 0 ? GAP / 2 : 0}px)`,
        width: `calc(${widthPct}% - ${GUTTER * 2}px - ${totalLanes > 1 ? GAP : 0}px)`,
        backgroundColor: hexAlpha(color, 0.1),
        border:     `1px solid ${hexAlpha(color, 0.18)}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 6,
        padding:    isTiny ? "3px 6px" : "5px 7px",
        overflow:   "hidden",
        cursor:     "pointer",
        boxShadow:  "0 1px 2px rgba(0,0,0,0.03)",
        transition: "box-shadow 0.15s ease, background-color 0.15s ease",
        zIndex: 1,
        display:        "flex",
        flexDirection:  "column",
        gap: 1,
        minWidth: 0,
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow       = "0 6px 16px rgba(0,0,0,0.14)";
        e.currentTarget.style.zIndex          = "20";
        e.currentTarget.style.backgroundColor = hexAlpha(color, 0.16);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow       = "0 1px 2px rgba(0,0,0,0.03)";
        e.currentTarget.style.zIndex          = "1";
        e.currentTarget.style.backgroundColor = hexAlpha(color, 0.1);
      }}
    >
      <p style={{
        fontSize:      isVeryNarrow ? 10.5 : 11.5,
        fontWeight:    600,
        color:         "var(--ink)",
        margin:        0,
        whiteSpace:    "nowrap",
        overflow:      "hidden",
        textOverflow:  "ellipsis",
        lineHeight:    1.2,
        minWidth:      0,
      }}>
        {title}
      </p>

      {!isShort && !isNarrow && (
        <p style={{
          fontSize:     10,
          fontWeight:   600,
          color,
          margin:       0,
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          lineHeight:   1.2,
        }}>
          {timeLabel}
        </p>
      )}

      {!isShort && !isVeryNarrow && client && (
        <p style={{
          fontSize:     10,
          fontWeight:   500,
          color:        "var(--ink-tertiary)",
          margin:       0,
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          lineHeight:   1.2,
          display:      "flex",
          alignItems:   "center",
          gap:          3,
          minWidth:     0,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "var(--ink-tertiary)", flexShrink: 0 }} />
          {client}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// WEEK CALENDAR
// ────────────────────────────────────────────────
export default function WeekCalendar({ days, bookings, isLoading }: WeekCalendarProps) {
  const bookingsByDay = useMemo(() => {
    const map: WeekCalendarBooking[][] = Array.from({ length: 7 }, () => []);
    bookings.forEach((b) => map[b.dayIndex]?.push(b));
    return map.map((dayBookings) => computeLanes(dayBookings));
  }, [bookings]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Zone scrollable unique */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", backgroundColor: "var(--canvas)" }}>
        <div style={{ minWidth: 640 }}>

          {/* Day headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
            position:  "sticky",
            top:       0,
            zIndex:    10,
            backgroundColor: "var(--canvas-pure)",
            borderBottom:    "1px solid var(--hairline)",
          }}>
            <div style={{ borderRight: "1px solid var(--hairline)" }} />
            {days.map((day, i) => {
              const active = isToday(day);
              return (
                <div key={i} style={{
                  padding:         "10px 0 9px",
                  textAlign:       "center",
                  borderRight:     i < 6 ? "1px solid var(--hairline)" : "none",
                  backgroundColor: active ? "var(--accent-tint)" : "transparent",
                }}>
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

            {/* Hour labels column */}
            <div style={{ borderRight: "1px solid var(--hairline)", position: "relative", height: GRID_H }}>
              {HOURS.map((h) => (
                <div key={h} style={{
                  position:   "absolute",
                  top:        (h - HOUR_START) * SLOT_PX - 8,
                  right:      8,
                  fontSize:   10,
                  fontWeight: 500,
                  color:      "var(--ink-tertiary)",
                  lineHeight: 1,
                  userSelect: "none",
                }}>
                  {h < 10 ? `0${h}:00` : `${h}:00`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, colIdx) => {
              const colBookings = bookingsByDay[colIdx];
              const active = isToday(day);
              return (
                <div key={colIdx} style={{
                  position:        "relative",
                  height:          GRID_H,
                  borderRight:     colIdx < 6 ? "1px solid var(--hairline)" : "none",
                  backgroundColor: active ? hexAlpha("#D4466E", 0.02) : "transparent",
                }}>
                  {/* Hour guide lines */}
                  {HOURS.map((h) => (
                    <div key={h} style={{
                      position:        "absolute",
                      top:             (h - HOUR_START) * SLOT_PX,
                      left:            0,
                      right:           0,
                      height:          1,
                      backgroundColor: h === HOUR_START ? "transparent" : "var(--hairline)",
                    }} />
                  ))}

                  {/* Half-hour lines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div key={`${h}-half`} style={{
                      position:        "absolute",
                      top:             (h - HOUR_START) * SLOT_PX + SLOT_PX / 2,
                      left:            8,
                      right:           8,
                      height:          1,
                      backgroundColor: "var(--hairline)",
                      opacity:         0.5,
                    }} />
                  ))}

                  {/* Skeleton while loading */}
                  {isLoading && colIdx === 0 && (
                    <div style={{
                      position:        "absolute",
                      top:             2 * SLOT_PX,
                      left:            3,
                      right:           3,
                      height:          SLOT_PX - 4,
                      borderRadius:    8,
                      background:      "var(--surface-3)",
                      opacity:         0.5,
                      animation:       "pulse 1.5s ease-in-out infinite",
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
  );
}
