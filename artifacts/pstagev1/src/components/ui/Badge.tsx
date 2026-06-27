import { type ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "accent"
  | "neutral";

const STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  success: { bg: "var(--success-bg)",  color: "var(--success)",        border: "rgba(26,138,76,0.2)" },
  error:   { bg: "var(--error-bg)",    color: "var(--error)",          border: "rgba(214,51,74,0.2)" },
  warning: { bg: "#FEF9EC",            color: "#B45309",               border: "rgba(180,83,9,0.2)" },
  info:    { bg: "#EEF4FF",            color: "#3B6FE0",               border: "rgba(59,111,224,0.2)" },
  accent:  { bg: "var(--accent-tint)", color: "var(--accent)",         border: "var(--accent-hairline)" },
  neutral: { bg: "rgba(12,12,14,0.04)", color: "var(--ink-secondary)", border: "var(--hairline)" },
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
}

export function Badge({ variant = "neutral", children, dot = false }: BadgeProps) {
  const s = STYLES[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        paddingInline: 8,
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: "var(--radius-chip)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: s.color,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
