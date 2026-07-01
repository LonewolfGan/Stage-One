import { ds } from "@/lib/design-system";

export type Status = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
export type BookingStatus = Status;

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<Status, { label: string; color: string; bg: string }> = {
    PENDING:   { label: "En attente",   color: ds.colors.accent,   bg: ds.colors.accentLight },
    CONFIRMED: { label: "Confirmé",    color: ds.colors.success,  bg: ds.colors.successBg },
    CANCELLED: { label: "Annulé",      color: ds.colors.error,    bg: ds.colors.errorBg },
    COMPLETED: { label: "Terminé",     color: ds.colors.ink,      bg: ds.colors.canvasMuted },
    EXPIRED:   { label: "Expiré",      color: ds.colors.inkTertiary, bg: ds.colors.canvasMuted },
  };

  const { label, color, bg } = config[status];

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: bg,
        color: color,
      }}
    >
      {label}
    </span>
  );
}