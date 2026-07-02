import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, Clock, User, Scissors, CreditCard, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { ds } from "@/lib/design-system";

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
  clientInitials: string;
  type: string;
  // Extra fields for modal + filter
  status?: string;
  amountCents?: number;
  staffName?: string;
  staffId?: string;
  durationMinutes?: number;
  startIso?: string;
  endIso?: string;
}

interface Stacked extends WeekCalendarBooking {
  top: number;
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
const PILL_H     = 24;
const PILL_GAP   = 6;
const DAY_SHORT  = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

function getServiceColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("coupe") && n.includes("homme"))  return "#3B82F6";
  if (n.includes("coupe") && n.includes("femme"))  return "#A855F7";
  if (n.includes("coupe"))                          return "#6366F1";
  if (n.includes("coloration"))                     return "#D4466E";
  if (n.includes("brushing"))                       return "#F97316";
  if (n.includes("soin") && n.includes("visage"))   return "#06B6D4";
  if (n.includes("soin") || n.includes("kératine")) return "#10B981";
  if (n.includes("hammam"))                         return "#B45309";
  if (n.includes("massage") || n.includes("enveloppement") || n.includes("rhassoul")) return "#8B5CF6";
  if (n.includes("manucure") || n.includes("épilation")) return "#EC4899";
  if (n.includes("pack"))                           return "#0EA5E9";
  return "#6B7280";
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

function computeStack(bookings: WeekCalendarBooking[]): Stacked[] {
  if (bookings.length === 0) return [];
  const sorted = [...bookings].sort((a, b) => a.start - b.start);
  let cursor = 0;
  return sorted.map((b) => {
    const safeStart = isFinite(b.start) ? b.start : HOUR_START;
    const naturalTop = (safeStart - HOUR_START) * SLOT_PX;
    const top = Math.max(naturalTop, cursor);
    cursor = top + PILL_H + PILL_GAP;
    return { ...b, top };
  });
}

function getStatusLabel(status?: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "CONFIRMED":  return { label: "Confirmé",   color: ds.colors.success,     bg: ds.colors.successBg  };
    case "PENDING":    return { label: "En attente", color: ds.colors.accent,      bg: ds.colors.accentLight };
    case "CANCELLED":  return { label: "Annulé",     color: ds.colors.error,       bg: ds.colors.errorBg    };
    case "COMPLETED":  return { label: "Terminé",    color: ds.colors.inkTertiary, bg: ds.colors.canvasMuted };
    case "EXPIRED":    return { label: "Expiré",     color: ds.colors.inkDisabled, bg: ds.colors.canvasMuted };
    default:           return { label: status ?? "—", color: ds.colors.inkTertiary, bg: ds.colors.canvasMuted };
  }
}

// ────────────────────────────────────────────────
// AVATAR
// ────────────────────────────────────────────────
function Avatar({
  initials,
  size = 32,
  bg = "rgba(255,255,255,0.14)",
  color = "#FFFFFF",
  fontSize = 11,
}: {
  initials: string;
  size?: number;
  bg?: string;
  color?: string;
  fontSize?: number;
}) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      backgroundColor: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize, fontWeight: 600, color, letterSpacing: "0.02em" }}>
        {initials}
      </span>
    </div>
  );
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
  const { title, client, clientInitials, start, end, type, status, amountCents, staffName } = booking;
  const color      = getServiceColor(type);
  const timeLabel  = `${formatHour(start)} – ${formatHour(end)}`;
  const duration   = Math.round((end - start) * 60);
  const statusInfo = getStatusLabel(status);
  const hasClient  = client && client !== "—";
  const price      = amountCents != null ? `${(amountCents / 100).toLocaleString("fr-MA")} MAD` : null;

  if (!position) return null;

  const POPUP_W = 264;
  const MARGIN  = 10;

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
        backgroundColor: ds.colors.canvasMuted,
        borderRadius:    12,
        overflow:        "hidden",
        zIndex:          300,
        pointerEvents:   "none",
        boxShadow:       "0 4px 6px -1px rgba(0,0,0,0.08), 0 16px 40px -6px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.09)",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, backgroundColor: color, width: "100%" }} />

      {/* Header: service name + status badge */}
      <div style={{ padding: "12px 14px 0px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <p style={{
            fontSize:      13,
            fontWeight:    650,
            color:         ds.colors.ink,
            margin:        0,
            lineHeight:    1.3,
            letterSpacing: "-0.015em",
            flex:          1,
            minWidth:      0,
          }}>
            {title}
          </p>
          {/* Status badge */}
          <span style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             4,
            backgroundColor: statusInfo.bg,
            color:           statusInfo.color,
            borderRadius:    999,
            padding:         "2px 7px",
            fontSize:        10,
            fontWeight:      650,
            letterSpacing:   "0.01em",
            whiteSpace:      "nowrap",
            flexShrink:      0,
          }}>
            <span style={{
              width: 5, height: 5,
              borderRadius: "50%",
              backgroundColor: statusInfo.color,
              display: "inline-block",
              flexShrink: 0,
            }} />
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Time + duration */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Clock size={12} strokeWidth={2} color={ds.colors.inkTertiary} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: ds.colors.inkSecondary, letterSpacing: "-0.01em" }}>
            {timeLabel}
          </span>
          <span style={{
            fontSize:        10,
            fontWeight:      600,
            color:           hexAlpha(color, 0.9),
            backgroundColor: hexAlpha(color, 0.10),
            borderRadius:    4,
            padding:         "1px 5px",
            marginLeft:      "auto",
          }}>
            {duration} min
          </span>
        </div>

        {/* Client */}
        {hasClient && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width:           22,
              height:          22,
              borderRadius:    "50%",
              backgroundColor: hexAlpha(color, 0.14),
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              flexShrink:      0,
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: "0.02em" }}>
                {clientInitials}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: ds.colors.inkSecondary }}>
              {client}
            </span>
          </div>
        )}

        {/* Staff */}
        {staffName && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <User size={12} strokeWidth={2} color={ds.colors.inkTertiary} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 400, color: ds.colors.inkTertiary }}>
              {staffName}
            </span>
          </div>
        )}

        {/* Price */}
        {price && (
          <div style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
            backgroundColor: "var(--surface-2)",
            borderRadius:    7,
            padding:         "6px 9px",
            marginTop:       2,
          }}>
            <span style={{ fontSize: 11, color: ds.colors.inkTertiary, fontWeight: 500 }}>Montant</span>
            <span style={{ fontSize: 12, fontWeight: 650, color: ds.colors.ink }}>{price}</span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ height: 1, backgroundColor: ds.colors.canvasMuted }} />
      <div style={{
        padding:         "7px 14px",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
      }}>
        <span style={{ fontSize: 10, color: ds.colors.inkDisabled, fontWeight: 500, letterSpacing: "0.01em" }}>
          Cliquer pour les détails
        </span>
        <ChevronRight size={10} color={ds.colors.inkDisabled} strokeWidth={2} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// BOOKING MODAL
// ────────────────────────────────────────────────
function BookingModal({
  booking,
  onClose,
}: {
  booking: WeekCalendarBooking;
  onClose: () => void;
}) {
  const color = getServiceColor(booking.type);
  const statusInfo = getStatusLabel(booking.status);
  const timeLabel = `${formatHour(booking.start)} – ${formatHour(booking.end)}`;
  const duration = booking.durationMinutes ?? Math.round((booking.end - booking.start) * 60);
  const hasClient = booking.client && booking.client !== "—";

  const dateLabel = booking.startIso
    ? format(new Date(booking.startIso), "EEEE d MMMM yyyy", { locale: fr })
    : "";

  const price = booking.amountCents != null
    ? `${(booking.amountCents / 100).toLocaleString("fr-MA")} MAD`
    : null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:        "fixed",
          inset:           0,
          backgroundColor: "rgba(14,14,18,0.48)",
          zIndex:          500,
          backdropFilter:  "blur(2px)",
        }}
      />

      {/* Panel — centré sur desktop, bottom-sheet sur mobile */}
      <div
        style={{
          position:        "fixed",
          zIndex:          501,
          /* Desktop: centré */
          top:             "50%",
          left:            "50%",
          transform:       "translate(-50%, -50%)",
          /* Largeur fluide : max 420px, min 0, jamais hors écran */
          width:           "calc(100vw - 32px)",
          maxWidth:        420,
          backgroundColor: ds.colors.canvas,
          borderRadius:    16,
          overflow:        "hidden",
          display:         "flex",
          flexDirection:   "column",
          /* Hauteur max pour les petits écrans */
          maxHeight:       "calc(100dvh - 80px)",
        }}
      >
        {/* Barre couleur service */}
        <div style={{ height: 3, backgroundColor: color, flexShrink: 0 }} />

        {/* Header — fixe, ne scroll pas */}
        <div style={{
          flexShrink:     0,
          padding:        "16px 18px 14px",
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          gap:            12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             5,
              backgroundColor: statusInfo.bg,
              borderRadius:    6,
              padding:         "3px 8px",
              marginBottom:    8,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: statusInfo.color, display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: statusInfo.color, letterSpacing: "0.01em" }}>
                {statusInfo.label}
              </span>
            </div>
            <h2 style={{
              fontSize:      16,
              fontWeight:    600,
              color:         "var(--ink)",
              margin:        0,
              letterSpacing: "-0.015em",
              lineHeight:    1.25,
            }}>
              {booking.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              flexShrink:     0,
              width:          32,
              height:         32,
              borderRadius:   8,
              border:         "1px solid var(--hairline)",
              background:     "none",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          "var(--ink-tertiary)",
              transition:     "background 120ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable si contenu trop long (mobile) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>

          {/* Client card */}
          {hasClient && (
            <div style={{
              display:         "flex",
              alignItems:      "center",
              gap:             12,
              padding:         "11px 13px",
              backgroundColor: "var(--surface-2)",
              borderRadius:    10,
              marginBottom:    14,
            }}>
              <div style={{
                width:           40,
                height:          40,
                borderRadius:    "50%",
                backgroundColor: hexAlpha(color, 0.14),
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                flexShrink:      0,
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color, letterSpacing: "0.02em" }}>
                  {booking.clientInitials}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {booking.client}
                </p>
                <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "2px 0 0", fontWeight: 400 }}>
                  Client
                </p>
              </div>
            </div>
          )}

          {/* Info rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {dateLabel && (
              <InfoRow
                icon={<CheckCircle size={14} strokeWidth={1.75} />}
                label="Date"
                value={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
              />
            )}
            <InfoRow
              icon={<Clock size={14} strokeWidth={1.75} />}
              label="Horaire"
              value={`${timeLabel} · ${duration} min`}
            />
            {booking.staffName && (
              <InfoRow
                icon={<User size={14} strokeWidth={1.75} />}
                label="Collaborateur"
                value={booking.staffName}
              />
            )}
            <InfoRow
              icon={<Scissors size={14} strokeWidth={1.75} />}
              label="Prestation"
              value={booking.title}
            />
            {price && (
              <InfoRow
                icon={<CreditCard size={14} strokeWidth={1.75} />}
                label="Montant"
                value={price}
                valueStyle={{ fontWeight: 600, color: "var(--ink)" }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div style={{
      display:    "flex",
      alignItems: "center",
      gap:        10,
      padding:    "9px 2px",
    }}>
      <span style={{ color: "var(--ink-tertiary)", flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 12, color: "var(--ink-tertiary)", fontWeight: 500, minWidth: 88 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--ink-secondary)", fontWeight: 400, marginLeft: "auto", textAlign: "right", ...valueStyle }}>
        {value}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────
// BOOKING PILL
// ────────────────────────────────────────────────
function BookingPill({
  booking,
  scrollContainerRef,
  onHover,
  onLeave,
  onClick,
}: {
  booking: Stacked;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onHover: (booking: Stacked, position: PopupPosition) => void;
  onLeave: () => void;
  onClick: (booking: Stacked) => void;
}) {
  const { top, title, type } = booking;
  const color = getServiceColor(type);
  const ref   = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!ref.current || !scrollContainerRef.current) return;
    const container     = scrollContainerRef.current;
    const pill          = ref.current;
    const containerRect = container.getBoundingClientRect();
    const pillRect      = pill.getBoundingClientRect();

    const relTop  = pillRect.top  - containerRect.top  + container.scrollTop;
    const relLeft = pillRect.left - containerRect.left + container.scrollLeft;

    const POPUP_W = 240;
    const MARGIN  = 8;
    const wouldOverflowRight = pillRect.right + POPUP_W + MARGIN > containerRect.right;

    onHover(booking, { top: relTop, left: relLeft, elementWidth: pillRect.width, wouldOverflowRight });
  }, [booking, scrollContainerRef, onHover]);

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      onClick={() => { onLeave(); onClick(booking); }}
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
  const [hovered,  setHovered]  = useState<{ booking: Stacked; position: PopupPosition } | null>(null);
  const [selected, setSelected] = useState<WeekCalendarBooking | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { bookingsByDay, effectiveHeight } = useMemo(() => {
    const map: WeekCalendarBooking[][] = Array.from({ length: 7 }, () => []);
    bookings.forEach((b) => map[b.dayIndex]?.push(b));
    const byDay = map.map((dayBookings) => computeStack(dayBookings));

    let maxH = GRID_H;
    byDay.forEach((col) => {
      if (col.length > 0) {
        const bottom = Math.max(...col.map((b) => b.top + PILL_H));
        maxH = Math.max(maxH, bottom + PILL_GAP * 4);
      }
    });

    return { bookingsByDay: byDay, effectiveHeight: maxH };
  }, [bookings]);

  const handleHover  = useCallback((booking: Stacked, position: PopupPosition) => {
    setHovered({ booking, position });
  }, []);
  const handleLeave  = useCallback(() => setHovered(null), []);
  const handleClick  = useCallback((booking: Stacked) => setSelected(booking), []);
  const handleClose  = useCallback(() => setSelected(null), []);

  return (
    <>
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
                        onClick={handleClick}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Popup */}
            {hovered && (
              <BookingPopup
                booking={hovered.booking}
                position={hovered.position}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal — rendered outside scroll container via fixed positioning */}
      {selected && (
        <BookingModal booking={selected} onClose={handleClose} />
      )}
    </>
  );
}
