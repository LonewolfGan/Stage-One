import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  icon?: ReactNode;
}

export function DataCard({ label, value, subValue, trend, trendValue, icon }: DataCardProps) {
  return (
    <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink-tertiary)",
          }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: "var(--ink-disabled)", display: "flex" }}>{icon}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {subValue && (
          <span style={{ fontSize: 14, color: "var(--ink-tertiary)", fontWeight: 400 }}>
            {subValue}
          </span>
        )}
      </div>

      {trend && trendValue && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {trend === "up"   && <TrendingUp  size={13} color="var(--success)" />}
          {trend === "down" && <TrendingDown size={13} color="var(--error)"  />}
          {trend === "flat" && <Minus        size={13} color="var(--ink-tertiary)" />}
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color:
                trend === "up" ? "var(--success)" :
                trend === "down" ? "var(--error)" : "var(--ink-tertiary)",
            }}
          >
            {trendValue} ce mois
          </span>
        </div>
      )}
    </div>
  );
}
