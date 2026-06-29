import { useMemo, useState, useRef, useCallback } from "react";
import { format } from "date-fns";

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────
export interface WeekCalendarBooking {
  id: string;
  dayIndex: number;
  start: number;  // decimal hour, e.g. 9.5 = 09:30
  end: number;
  title: string;
  client: string;
  type: string;
}

interface Stacked extends WeekCalendarBooking {
  top: number; // computed pixel top within the day column (no overlap guaranteed)
}

interface PopupPosition {
  top: number;
  left: number;
  elementWidth: number;
  wouldOverflowRight: boolean;
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
const PILL_H     = 24;   // fixed pill height in px
const PILL_GAP   = 6;    // vertical gap between stacked pills
const DAY_SHORT  = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

// Keyword-based color matching against the service name (lowercased)
function getServiceColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("coupe") && n.includes("homme"))  return "#3B82F6"; // blue
  if (n.includes("coupe") && n.includes("femme"))  return "#A855F7"; // purple
  if (n.includes("coupe"))                          return "#6366F1"; // indigo (coupe générique)
  if (n.includes("coloration"))                     return "#D4466E"; // rose
  if (n.includes("brushing"))                       return "#F97316"; // orange
  if (n.includes("soin") && n.includes("visage"))   return "#06B6D4"; // cyan
  if (n.includes("soin") || n.includes("kératine")) return "#10B981"; // emerald
  if (n.includes("hammam"))                         return "#B45309"; // amber-dark
  if (n.includes("massage") || n.includes("enveloppement") || n.includes("rhassoul")) return "#8B5CF6"; // violet
  if (n.includes("manucure") || n.includes("épilation")) return "#EC4899"; // pink
  if (n.includes("pack"))                           return "#0EA5E9"; // sky
  return "#6B7280"; // grey fallback
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
  return `${h < 10 ? "0" + h : h}:${m === 0 ? "00" : m < 10 ? "0" + m : m}`;
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
 * Single-cursor vertical stacking.
 * Pills are sorted by start time and placed at max(natural time position, cursor).
 * The cursor advances after each pill so the next one can never overlap.
 */
function computeStack(bookings: WeekCalendarBooking[]): Stacked[] {
  if (bookings.length === 0) return [];

  const sorted = [...bookings].sort((a, b) => a.start - b.start);

  let cursor = 0; // tracks the visual bottom of the last placed pill

  return sorted.map((b) => {
    const safeStart = isFinite(b.start) ? b.start : HOUR_START;
    const naturalTop = (safeStart - HOUR_START) * SLOT_PX;
    const top = Math.max(naturalTop, cursor);
    cursor = top + PILL_H + PILL_GAP;
    return { ...b, top };
  });
}

// ────────────────────────────────────────────────
// POPUP
// ────────────────────────────────────────────────
function BookingPopup({
  booking,
  position,
}: {
  booking: Stacked;
  position: PopupPosition | null;
}) {
  const { title, client, start, end, type } = booking;
  const color     = getServiceColor(type);
  const timeLabel = `${formatHour(start)} – ${formatHour(end)}`;

  if (!position) return null;

  const POPUP_W = 220;
  const MARGIN  = 8;

  const left = position.wouldOverflowRight
    ? position.left - POPUP_W - MARGIN
    : position.left + position.elementWidth + MARGIN;

  return (
    <div
      style={{
        position:        "absolute",
        top:             position.top,
        left,
        width:           POPUP_W,
        backgroundColor: "var(--canvas-pure)",
        border:          "1px solid var(--hairline)",
        borderRadius:    10,
        boxShadow:       "0 12px 32px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)",
        padding:         "12px 14px",
        zIndex:          200,
        pointerEvents:   "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{
          width:           8,
          height:          8,
          borderRadius:    "50%",
          backgroundColor: color,
          flexShrink:      0,
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>
          {title}
        </p>
      </div>
      <p style={{ fontSize: 11.5, fontWeight: 600, color, margin: "0 0 4px" }}>
        {timeLabel}
      </p>
      {client && (
        <p style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink-secondary)", margin: 0 }}>
          {client}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// BOOKING PILL
// Fixed-height badge showing only the service title.
// Stacked vertically when bookings overlap — never side-by-side.
// ────────────────────────────────────────────────
function BookingPill({
  booking,
  scrollContainerRef,
  onHover,
  onLeave,
}: {
  booking: Stacked;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onHover: (booking: Stacked, position: PopupPosition) => void;
  onLeave: () => void;
}) {
  const { top, title, type } = booking;
  const color = getServiceColor(type);
  const ref   = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!ref.current || !scrollContainerRef.current) return;
    const container    = scrollContainerRef.current;
    const pill         = ref.current;
    const containerRect = container.getBoundingClientRect();
    const pillRect      = pill.getBoundingClientRect();

    const relTop  = pillRect.top  - containerRect.top  + container.scrollTop;
    const relLeft = pillRect.left - containerRect.left + container.scrollLeft;

    const POPUP_W = 220;
    const MARGIN  = 8;
    const wouldOverflowRight = pillRect.right + POPUP_W + MARGIN > containerRect.right;

    onHover(booking, { top: relTop, left: relLeft, elementWidth: pillRect.width, wouldOverflowRight });
  }, [booking, scrollContainerRef, onHover]);

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      style={{
        position:        "absolute",
        top:             top + 2,
        left:            4,
        right:           4,
        height:          PILL_H,
        backgroundColor: hexAlpha(color, 0.12),
        border:          `1px solid ${hexAlpha(color, 0.28)}`,
        borderRadius:    5,
        padding:         "0 7px",
        overflow:        "hidden",
        cursor:          "pointer",
        zIndex:          1,
        boxSizing:       "border-box",
        display:         "flex",
        alignItems:      "center",
        transition:      "background-color 0.1s ease",
      }}
    >
      <span style={{
        fontSize:     10.5,
        fontWeight:   600,
        color:        "var(--ink)",
        whiteSpace:   "nowrap",
        overflow:     "hidden",
        textOverflow: "ellipsis",
        lineHeight:   1,
        minWidth:     0,
      }}>
        {title}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────
// WEEK CALENDAR
// ────────────────────────────────────────────────
export default function WeekCalendar({ days, bookings, isLoading }: WeekCalendarProps) {
  const [hovered, setHovered] = useState<{ booking: Stacked; position: PopupPosition } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { bookingsByDay, effectiveHeight } = useMemo(() => {
    const map: WeekCalendarBooking[][] = Array.from({ length: 7 }, () => []);
    bookings.forEach((b) => map[b.dayIndex]?.push(b));
    const byDay = map.map((dayBookings) => computeStack(dayBookings));

    // Expand grid height if pills overflow the natural GRID_H
    let maxH = GRID_H;
    byDay.forEach((col) => {
      if (col.length > 0) {
        const bottom = Math.max(...col.map((b) => b.top + PILL_H));
        maxH = Math.max(maxH, bottom + PILL_GAP * 4);
      }
    });

    return { bookingsByDay: byDay, effectiveHeight: maxH };
  }, [bookings]);

  const handleHover   = useCallback((booking: Stacked, position: PopupPosition) => {
    setHovered({ booking, position });
  }, []);
  const handleLeave   = useCallback(() => setHovered(null), []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        ref={scrollRef}
        style={{
          flex:            1,
          minHeight:       0,
          overflowY:       "auto",
          overflowX:       "auto",
          backgroundColor: "var(--canvas)",
          position:        "relative",
        }}
      >
        <div style={{ minWidth: 640, position: "relative" }}>

          {/* ── Day headers (sticky) ── */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
            position:            "sticky",
            top:                 0,
            zIndex:              10,
            backgroundColor:     "var(--canvas-pure)",
            borderBottom:        "1px solid var(--hairline)",
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
                  <p style={{
                    fontSize:      10,
                    fontWeight:    700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color:         active ? "var(--accent)" : "var(--ink-tertiary)",
                    margin:        "0 0 3px",
                  }}>
                    {DAY_SHORT[i]}
                  </p>
                  <p style={{
                    fontSize:      19,
                    fontWeight:    600,
                    letterSpacing: "-0.03em",
                    color:         active ? "var(--accent)" : "var(--ink)",
                    margin:        0,
                    lineHeight:    1,
                  }}>
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Time grid ── */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
            position:            "relative",
          }}>
            {/* Hour labels */}
            <div style={{ borderRight: "1px solid var(--hairline)", position: "relative", height: effectiveHeight }}>
              {HOURS.map((h) => (
                <div key={h} style={{
                  position:  "absolute",
                  top:       (h - HOUR_START) * SLOT_PX - 8,
                  right:     8,
                  fontSize:  10,
                  fontWeight:500,
                  color:     "var(--ink-tertiary)",
                  lineHeight:1,
                  userSelect:"none",
                }}>
                  {h < 10 ? `0${h}:00` : `${h}:00`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, colIdx) => {
              const colBookings = bookingsByDay[colIdx];
              const active      = isToday(day);
              return (
                <div key={colIdx} style={{
                  position:        "relative",
                  height:          effectiveHeight,
                  borderRight:     colIdx < 6 ? "1px solid var(--hairline)" : "none",
                  backgroundColor: active ? hexAlpha("#D4466E", 0.02) : "transparent",
                }}>
                  {/* Hour lines */}
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

                  {/* Skeleton */}
                  {isLoading && colIdx === 0 && (
                    <div style={{
                      position:     "absolute",
                      top:          2 * SLOT_PX,
                      left:         4,
                      right:        4,
                      height:       PILL_H,
                      borderRadius: 5,
                      background:   "var(--surface-3)",
                      opacity:      0.5,
                      animation:    "pulse 1.5s ease-in-out infinite",
                    }} />
                  )}

                  {/* Pills */}
                  {!isLoading && colBookings.map((b) => (
                    <BookingPill
                      key={b.id}
                      booking={b}
                      scrollContainerRef={scrollRef}
                      onHover={handleHover}
                      onLeave={handleLeave}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Popup — inside scrollable wrapper, same coordinate system */}
          {hovered && (
            <BookingPopup
              booking={hovered.booking}
              position={hovered.position}
            />
          )}
        </div>
      </div>
    </div>
  );
}
