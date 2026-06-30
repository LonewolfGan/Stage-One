import { ds } from "@/lib/design-system";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "EXPIRED";

const STATUS_MAP: Record<
  BookingStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING:   { label: "En attente", color: ds.colors.accent,      bg: ds.colors.accentLight,  border: ds.colors.accentBorder  },
  CONFIRMED: { label: "Confirmé",   color: ds.colors.success,     bg: ds.colors.successBg,    border: ds.colors.successBorder },
  CANCELLED: { label: "Annulé",     color: ds.colors.error,       bg: ds.colors.errorBg,      border: ds.colors.errorBorder   },
  COMPLETED: { label: "Terminé",    color: ds.colors.inkTertiary, bg: ds.colors.canvasMuted,  border: ds.colors.border        },
  EXPIRED:   { label: "Expiré",     color: ds.colors.inkDisabled, bg: ds.colors.canvasMuted,  border: ds.colors.border        },
};

interface StatusBadgeProps {
  status: BookingStatus | string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_MAP[status as BookingStatus] ?? {
    label:  status,
    color:  ds.colors.inkTertiary,
    bg:     ds.colors.canvasMuted,
    border: ds.colors.border,
  };

  return (
    <span
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        gap:             5,
        paddingInline:   size === "md" ? 10 : 8,
        paddingBlock:    size === "md" ? 4  : 3,
        borderRadius:    ds.radius.sm,
        border:          `1px solid ${config.border}`,
        backgroundColor: config.bg,
        fontSize:        size === "md" ? 12 : 11,
        fontWeight:      600,
        letterSpacing:   "0.01em",
        color:           config.color,
        whiteSpace:      "nowrap",
        flexShrink:      0,
      }}
    >
      <span
        style={{
          width:           5,
          height:          5,
          borderRadius:    "50%",
          backgroundColor: config.color,
          flexShrink:      0,
        }}
      />
      {config.label}
    </span>
  );
}
