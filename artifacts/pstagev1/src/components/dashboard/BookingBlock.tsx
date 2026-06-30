import { ds } from "@/lib/design-system";
import { StatusBadge, type BookingStatus } from "@/components/ui/status-badge";

interface BookingBlockData {
  id:         string;
  clientName: string;
  service:    string;
  staff:      string;
  time:       string;
  duration:   number;
  amount:     number;
  status:     string;
}

interface BookingBlockProps {
  booking: BookingBlockData;
  onClick?: (booking: BookingBlockData) => void;
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: "rgba(51, 202, 127, 0.08)",
  PENDING:   "rgba(212, 70, 110, 0.07)",
  CANCELLED: ds.colors.canvasMuted,
  COMPLETED: ds.colors.canvasSubtle,
  EXPIRED:   ds.colors.canvasSubtle,
};

const STATUS_BORDER: Record<string, string> = {
  CONFIRMED: "rgba(51, 202, 127, 0.22)",
  PENDING:   ds.colors.accentBorder,
  CANCELLED: ds.colors.border,
  COMPLETED: ds.colors.border,
  EXPIRED:   ds.colors.border,
};

export function BookingBlock({ booking, onClick }: BookingBlockProps) {
  const normalStatus = booking.status.toUpperCase() as BookingStatus;
  const bg     = STATUS_BG[normalStatus]     ?? ds.colors.canvasSubtle;
  const border = STATUS_BORDER[normalStatus] ?? ds.colors.border;
  const isBlocked = booking.status === "blocked";

  if (isBlocked) {
    return (
      <div
        style={{
          position:        "absolute",
          left:            4,
          right:           4,
          backgroundColor: ds.colors.canvasMuted,
          border:          `1px dashed ${ds.colors.borderMedium}`,
          borderRadius:    6,
          padding:         "4px 8px",
          overflow:        "hidden",
          cursor:          "default",
          display:         "flex",
          alignItems:      "center",
        }}
      >
        <p
          style={{
            fontSize:      11,
            fontWeight:    500,
            color:         ds.colors.inkDisabled,
            margin:        0,
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
          }}
        >
          Bloqué
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(booking)}
      style={{
        position:        "absolute",
        left:            4,
        right:           4,
        backgroundColor: bg,
        border:          `1px solid ${border}`,
        borderRadius:    6,
        padding:         "5px 8px",
        overflow:        "hidden",
        cursor:          onClick ? "pointer" : "default",
        display:         "flex",
        flexDirection:   "column",
        gap:             2,
        transition:      "filter 120ms ease",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.filter = "brightness(0.96)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "none"; }}
    >
      {/* Service name */}
      <p
        style={{
          fontSize:      12,
          fontWeight:    600,
          color:         ds.colors.ink,
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          whiteSpace:    "nowrap",
          margin:        0,
          letterSpacing: "-0.01em",
        }}
      >
        {booking.service}
      </p>

      {/* Client */}
      <p
        style={{
          fontSize:     11,
          color:        ds.colors.inkSecondary,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          margin:       0,
        }}
      >
        {booking.clientName}
      </p>

      {/* Footer: time · duration · price · status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
        <span style={{ fontSize: 10, color: ds.colors.inkTertiary }}>
          {booking.time}
        </span>
        <span style={{ fontSize: 10, color: ds.colors.inkDisabled }}>·</span>
        <span style={{ fontSize: 10, color: ds.colors.inkTertiary }}>
          {booking.duration} min
        </span>
        {booking.amount > 0 && (
          <>
            <span style={{ fontSize: 10, color: ds.colors.inkDisabled }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: ds.colors.ink }}>
              {Math.round(booking.amount / 100)} MAD
            </span>
          </>
        )}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <StatusBadge status={normalStatus} />
        </div>
      </div>
    </div>
  );
}
