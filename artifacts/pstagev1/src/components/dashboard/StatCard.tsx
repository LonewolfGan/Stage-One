import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({ label, value, subValue, trend, trendValue }: StatCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(12, 12, 14, 0.08)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>{label}</p>
      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
        <h3 style={{ fontSize: 24, fontWeight: 600, color: "#0C0C0E", letterSpacing: "-0.015em", margin: 0 }}>
          {value}
        </h3>
        {subValue && <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{subValue}</span>}
      </div>
      {trend && trendValue && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: trend === "up" ? "#1A8A4C" : trend === "down" ? "#D6334A" : "var(--ink-tertiary)",
            }}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>vs semaine dernière</span>
        </div>
      )}
    </motion.div>
  );
}
