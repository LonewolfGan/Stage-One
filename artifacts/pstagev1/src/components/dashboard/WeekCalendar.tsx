import { useMemo, useState, useRef, useCallback } from "react";
import { format } from "date-fns";

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────
export interface WeekCalendarBooking {
  id: string;
  dayIndex: number;
  start: number;
  end: number;
  title: string;
  client: string;
  type: string;
}

interface LaidOut extends WeekCalendarBooking {
  lane: number;
  totalLanes: number;
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
const HOUR_END = 19;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const SLOT_PX = 64;
const GRID_H = (HOUR_END - HOUR_START) * SLOT_PX;
const LABEL_W = 56;
const DAY_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const SERVICE_COLORS: Record<string, string> = {
  "coupe-homme": "#3B82F6",
  "coupe-femme": "#A855F7",
  coloration: "#D4466E",
  soin: "#10B981",
  default: "#6B7280",
};

function getServiceColor(type: string): string {
  return SERVICE_COLORS[type] || SERVICE_COLORS.default;
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
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function computeLanes(bookings: WeekCalendarBooking[]): LaidOut[] {
  if (bookings.length === 0) return [];
  const sorted = [...bookings].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });
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
// POPUP
// Fix: position relative to scroll container using
// element offsets instead of getBoundingClientRect,
// so it stays correct regardless of scroll position.
// ────────────────────────────────────────────────
function BookingPopup({ booking, position }: { booking: LaidOut; position: PopupPosition | null }) {
  const { title, client, start, end, type } = booking;
  const color = getServiceColor(type);
  const timeLabel = `${formatHour(start)} – ${formatHour(end)}`;

  if (!position) return null;

  const POPUP_W = 220;
  const MARGIN = 8;

  // position.{top, left, right, elementWidth} are all relative
  // to the scroll container's top-left (including scrollTop)
  let left = position.left + position.elementWidth + MARGIN;
  if (position.wouldOverflowRight) {
    left = position.left - POPUP_W - MARGIN;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: position.top,
        left,
        width: POPUP_W,
        backgroundColor: "var(--canvas-pure)",
        border: "1px solid var(--hairline)",
        borderRadius: 10,
        boxShadow: "0 12px 32px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)",
        padding: "12px 14px",
        zIndex: 200,
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
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
// Compact pill: dot + truncated title, no height
// constraint needed — just the pill height.
// ────────────────────────────────────────────────
function BookingPill({
  booking,
  scrollContainerRef,
  onHover,
  onLeave,
}: {
  booking: LaidOut;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onHover: (booking: LaidOut, position: PopupPosition) => void;
  onLeave: () => void;
}) {
  const { start, end, lane, totalLanes, title, type } = booking;
  const color = getServiceColor(type);
  const ref = useRef<HTMLDivElement>(null);

  const top = (start - HOUR_START) * SLOT_PX;
  // Min height = 20px (very short slots), normal = full slot minus gap
  const height = Math.max((end - start) * SLOT_PX - 4, 20);

  const GUTTER = 3;
  const GAP = 2;
  const widthPct = 100 / totalLanes;

  const handleMouseEnter = useCallback(() => {
    if (!ref.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const pill = ref.current;

    // Get positions relative to the scroll container's content area
    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();

    // Top relative to scrollable content (accounts for scrollTop)
    const relTop = pillRect.top - containerRect.top + container.scrollTop;
    const relLeft = pillRect.left - containerRect.left + container.scrollLeft;

    const POPUP_W = 220;
    const MARGIN = 8;
    const wouldOverflowRight = pillRect.right + POPUP_W + MARGIN > containerRect.right;

    onHover(booking, {
      top: relTop,
      left: relLeft,
      elementWidth: pillRect.width,
      wouldOverflowRight,
    });
  }, [booking, scrollContainerRef, onHover]);

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      style={{
        position: "absolute",
        top: top + 2,
        height,
        left: `calc(${GUTTER}px + ${lane * widthPct}% + ${lane > 0 ? GAP : 0}px)`,
        width: `calc(${widthPct}% - ${GUTTER * 2}px - ${totalLanes > 1 ? GAP : 0}px)`,
        backgroundColor: hexAlpha(color, 0.12),
        border: `1px solid ${hexAlpha(color, 0.28)}`,
        borderRadius: 6,
        padding: "0 7px",
        overflow: "hidden",
        cursor: "pointer",
        zIndex: 1,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        transition: "background-color 0.1s ease",
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--ink)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1,
          minWidth: 0,
        }}
      >
        {title}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────
// WEEK CALENDAR
// ────────────────────────────────────────────────
export default function WeekCalendar({ days, bookings, isLoading }: WeekCalendarProps) {
  const [hovered, setHovered] = useState<{ booking: LaidOut; position: PopupPosition } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bookingsByDay = useMemo(() => {
    const map: WeekCalendarBooking[][] = Array.from({ length: 7 }, () => []);
    bookings.forEach((b) => map[b.dayIndex]?.push(b));
    return map.map((dayBookings) => computeLanes(dayBookings));
  }, [bookings]);

  const handleHover = useCallback((booking: LaidOut, position: PopupPosition) => {
    setHovered({ booking, position });
  }, []);

  const handleLeave = useCallback(() => setHovered(null), []);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto", // allow horizontal scroll on small screens
          backgroundColor: "var(--canvas)",
          position: "relative",
        }}
      >
        {/*
          Fix: all content inside a single min-width wrapper so the sticky header
          and the grid always share the same column layout — no more left border bleed.
        */}
        <div style={{ minWidth: 640, position: "relative" }}>

          {/* ── Day headers (sticky) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "var(--canvas-pure)",
              borderBottom: "1px solid var(--hairline)",
              // Fix: keep border inside the wrapper, no negative margin tricks
            }}
          >
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
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: active ? "var(--accent)" : "var(--ink-tertiary)",
                      margin: "0 0 3px",
                    }}
                  >
                    {DAY_SHORT[i]}
                  </p>
                  <p
                    style={{
                      fontSize: 19,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      color: active ? "var(--accent)" : "var(--ink)",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Time grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(7, 1fr)`,
              position: "relative",
            }}
          >
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
              const colBookings = bookingsByDay[colIdx];
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
                  {/* Hour lines */}
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

                  {/* Loading skeleton */}
                  {isLoading && colIdx === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 2 * SLOT_PX,
                        left: 3,
                        right: 3,
                        height: SLOT_PX - 4,
                        borderRadius: 8,
                        background: "var(--surface-3)",
                        opacity: 0.5,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  )}

                  {/* Pills */}
                  {!isLoading &&
                    colBookings.map((b) => (
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

          {/* Popup — rendered inside the scrollable wrapper so absolute positioning
              is relative to the same coordinate system as the pills */}
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
