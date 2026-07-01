import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useBreakpoint } from "@/hooks/use-mobile";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { Scissors, Star, ArrowDownRight } from "lucide-react";
import { TrendingUpIcon }   from "@/components/ui/trending-up";
import { UsersIcon }        from "@/components/ui/users";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";

const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DAY_NAMES   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const PERIOD_MAP: Record<Period, "7d" | "30d" | "3m" | "1y"> = {
  "7j": "7d", "1M": "30d", "3M": "3m", "1A": "1y",
};

type DayEntry = { date: string; count: number };

function formatChartData(days: DayEntry[], period: Period): { name: string; bookings: number }[] {
  if (days.length === 0) return [];
  if (period === "7j" || period === "1M") {
    return days.map((d) => {
      const dt = new Date(d.date + "T12:00:00");
      const name = period === "7j"
        ? DAY_NAMES[dt.getDay()]
        : `${dt.getDate()} ${MONTH_SHORT[dt.getMonth()]}`;
      return { name, bookings: d.count };
    });
  }
  if (period === "3M") {
    const buckets: Record<string, number> = {};
    days.forEach((d, i) => {
      const week = `S${Math.floor(i / 7) + 1}`;
      buckets[week] = (buckets[week] ?? 0) + d.count;
    });
    return Object.entries(buckets).map(([name, bookings]) => ({ name, bookings }));
  }
  // 1A — group by month
  const buckets: Record<string, number> = {};
  const order: string[] = [];
  days.forEach((d) => {
    const dt = new Date(d.date + "T12:00:00");
    const key = MONTH_SHORT[dt.getMonth()];
    if (!buckets[key]) { buckets[key] = 0; order.push(key); }
    buckets[key] += d.count;
  });
  return order.map((name) => ({ name, bookings: buckets[name] }));
}

/** Largest-remainder method — guarantees sum == 100 */
function distributePercent(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);
  const exact   = counts.map(c => (c / total) * 100);
  const floored = exact.map(Math.floor);
  let remainder = 100 - floored.reduce((a, b) => a + b, 0);
  const order   = exact
    .map((v, i) => ({ i, dec: v - Math.floor(v) }))
    .sort((a, b) => b.dec - a.dec);
  for (let k = 0; k < remainder; k++) floored[order[k].i]++;
  return floored;
}

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--hairline)",
  backgroundColor: "var(--surface-1)",
  fontSize: 12,
  color: "var(--ink)",
  padding: "8px 12px",
};

function KpiCard({
  label, value, sub, delta, positive, icon, sparkData, chartId,
}: {
  label: string; value: string; sub?: string; delta?: string; positive?: boolean;
  icon: React.ReactNode; sparkData: { v: number }[]; chartId: string;
}) {
  const gradId = `sk-${chartId}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="ds-card"
      style={{ padding: 20, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", gap: 0 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          backgroundColor: "rgba(12,12,14,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-secondary)",
        }}>
          {icon}
        </div>
        {delta && (
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 600,
            color:           positive ? "#166534" : "#9B1239",
            backgroundColor: positive ? "#DCFCE7"  : "#FCE7F0",
            padding: "3px 8px", borderRadius: 20,
          }}>
            {positive ? <ArrowUpRightIcon size={11} /> : <ArrowDownRight size={11} />}{delta}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 3 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{sub}</span>}
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>{label}</p>

      {/* Sparkline — subtle ink tone */}
      <div style={{ height: 36, marginInline: -20, marginBottom: -20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0C0C0E" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#0C0C0E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="rgba(12,12,14,0.25)" strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ── Ranked service row — leaderboard style ── */
const BAR_COLORS = [
  "#0E0E12",   // ink     — rank 1
  "#0E0E12",   // ink     — rank 2
  "#53565C",   // ink-secondary — rank 3
  "#53565C",   // ink-secondary — rank 4
  "#8A8D93",   // ink-tertiary  — rank 5
];

function ServiceRankRow({
  rank, name, count, pct, percent, delay,
}: {
  rank: number; name: string; count: number;
  pct: number; percent: number; delay: number;
}) {
  const barColor = BAR_COLORS[rank - 1] ?? "#8A8D93";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.38, ease: [0, 0, 0.2, 1] }}
      style={{ paddingBlock: 11, borderBottom: "1px solid var(--hairline)" }}
    >
      {/* Top line: rank · name · count · percent */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
          color: "var(--ink-disabled)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 18, flexShrink: 0,
        }}>
          {String(rank).padStart(2, "0")}
        </span>

        <span style={{
          fontSize: 13, fontWeight: 500, color: "var(--ink)",
          letterSpacing: "-0.01em", flex: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {name}
        </span>

        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--ink)",
          letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
        }}>
          {count}
        </span>

        <span style={{
          fontSize: 10, color: "var(--ink-tertiary)",
          fontVariantNumeric: "tabular-nums", minWidth: 26, textAlign: "right",
        }}>
          {percent}%
        </span>
      </div>

      {/* Bar track */}
      <div style={{ paddingLeft: 26 }}>
        <div style={{
          height: 3, backgroundColor: "var(--surface-3)",
          borderRadius: 2, overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ delay: delay + 0.18, duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
            style={{ height: "100%", backgroundColor: barColor, borderRadius: 2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--ink)", fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: 0, color: "var(--ink-secondary)", fontSize: 12 }}>
          {p.name}: <strong style={{ color: "var(--ink)" }}>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ── Circular fill-rate gauge (Figma-style, palette adaptée) ── */
function CircularFillRate({ rate }: { rate: number }) {
  const SIZE    = 194;
  const CX      = SIZE / 2;         // 97
  const CY      = SIZE / 2;         // 97
  const R_OUTER = 90;               // rayon de la piste extérieure
  const R_INNER = 43;               // rayon du cercle plein central
  const STROKE  = 14;               // épaisseur de la piste
  const clipped = Math.min(Math.max(rate, 0), 100);

  // Stroke-dasharray pour l'arc de progression
  const circ  = 2 * Math.PI * R_OUTER;
  const dash  = (clipped / 100) * circ;
  const gap   = circ - dash;

  // Rotation : on commence à midi (−90°)
  const startRot = -90;

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Piste de fond */}
      <circle
        cx={CX}
        cy={CY}
        r={R_OUTER}
        stroke="var(--accent-tint)"
        strokeWidth={STROKE}
        fill="none"
      />

      {/* Arc de progression */}
      <circle
        cx={CX}
        cy={CY}
        r={R_OUTER}
        stroke="var(--accent)"
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(${startRot} ${CX} ${CY})`}
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)" }}
      />

      {/* Cercle central plein */}
      <circle
        cx={CX}
        cy={CY}
        r={R_INNER}
        fill="var(--accent)"
      />

      {/* Pourcentage centré */}
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={22}
        fontWeight={500}
        fontFamily="var(--font)"
        letterSpacing="-0.01em"
      >
        {clipped}%
      </text>
    </svg>
  );
}

/* Compact stat widget — replaces colored EarningWidget */
function StatWidget({ label, value, sub, dark }: { label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <div
      className="ds-card"
      style={{
        padding: "16px 18px",
        backgroundColor: dark ? "#0C0C0E" : undefined,
        border: dark ? "none" : undefined,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.45)" : "var(--ink-tertiary)", margin: "0 0 6px" }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: dark ? "#FFFFFF" : "var(--ink)", margin: 0 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.38)" : "var(--ink-tertiary)", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

type Period = "7j" | "1M" | "3M" | "1A";
const PERIOD_LABELS: Record<Period, string> = {
  "7j": "7 derniers jours",
  "1M": "30 derniers jours",
  "3M": "3 derniers mois",
  "1A": "12 derniers mois",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("1M");
  const { isLg, isMd } = useBreakpoint();

  const { data: analytics } = useQuery({
    queryKey: ["dashboard", "analytics", period],
    queryFn: () => api.getAnalytics(PERIOD_MAP[period]),
    staleTime: 60_000,
  });

  // Always keep 7d data for the weekly bar chart (independent of period selector)
  const { data: weekAnalytics } = useQuery({
    queryKey: ["dashboard", "analytics", "7d-fixed"],
    queryFn: () => api.getAnalytics("7d"),
    staleTime: 60_000,
  });

  const totalBookings  = analytics?.totalBookings  ?? "—";
  const revenueMad     = analytics?.revenueMad     != null ? analytics.revenueMad.toLocaleString("fr-MA") : "—";
  const fillRate       = analytics?.fillRate       != null ? analytics.fillRate : "—";
  const uniqueClients  = analytics?.uniqueClients  ?? "—";

  const apiDays: DayEntry[] = analytics?.bookingsByDay ?? [];
  const chartData = formatChartData(apiDays, period);
  const xAxisInterval = period === "7j" ? 0 : period === "3M" ? 1 : period === "1A" ? 0 : 5;

  const weekData = (weekAnalytics?.bookingsByDay ?? []).map((d: DayEntry) => {
    const dt = new Date(d.date + "T12:00:00");
    return { name: DAY_NAMES[dt.getDay()], bookings: d.count };
  });

  const serviceData: { name: string; count: number }[] = analytics?.topServices ?? [];
  const staffData: { staffId: string; name: string; bookings: number }[] = analytics?.staffPerformance ?? [];

  // Taux de remplissage du jour — derived from fillRate returned by current period
  const dailyFillRate = typeof fillRate === "number" ? Math.round(fillRate) : 0;

  const sparkDays = apiDays.slice(-12).map((d) => ({ v: d.count }));

  return (
    <DashboardLayout title="Statistiques" breadcrumb="Statistiques">

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMd ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Réservations" value={`${totalBookings}`} icon={<TrendingUpIcon size={16} />} sparkData={sparkDays} chartId="a" />
        <KpiCard label="CA estimé" value={revenueMad} sub={revenueMad !== "—" ? "MAD" : undefined} icon={<Star size={16} color="var(--ink-secondary)" />} sparkData={sparkDays} chartId="b" />
        <KpiCard label="Taux de remplissage" value={fillRate === "—" ? "—" : `${fillRate}%`} icon={<Scissors size={16} color="var(--ink-secondary)" />} sparkData={sparkDays} chartId="c" />
        <KpiCard label="Clients uniques" value={`${uniqueClients}`} icon={<UsersIcon size={16} />} sparkData={sparkDays} chartId="d" />
      </div>

      {/* ── Area chart + pill bars ── */}
      <div style={{ display: "grid", gridTemplateColumns: isLg ? "2fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>

        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
                Tendance des réservations
              </h2>
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>
                {PERIOD_LABELS[period]}
              </p>
            </div>
            {/* Period filter pills */}
            <div style={{ display: "flex", gap: 2, backgroundColor: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
              {(["7j", "1M", "3M", "1A"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    fontSize: 11, fontWeight: 500, padding: "4px 10px",
                    borderRadius: 6, border: "none", cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    backgroundColor: period === p ? "var(--surface-1)" : "transparent",
                    color: period === p ? "var(--ink)" : "var(--ink-tertiary)",
                    boxShadow: period === p ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ga-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#33CA7F" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#33CA7F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--hairline)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} interval={xAxisInterval} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="bookings" name="Réservations" stroke="#33CA7F" strokeWidth={2} fill="url(#ga-main)" dot={false} activeDot={{ r: 4, fill: "#33CA7F", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
                Prestations populaires
              </h2>
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>Ce mois — par volume</p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "var(--ink-secondary)",
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: 6, padding: "3px 8px",
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
              flexShrink: 0,
            }}>
              {serviceData.reduce((s, x) => s + x.count, 0)} RDV
            </span>
          </div>

          {/* Ranked rows */}
          <div style={{ marginTop: 8 }}>
            {serviceData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>Pas encore de données sur cette période</p>
              </div>
            ) : (() => {
              const total    = serviceData.reduce((acc, x) => acc + x.count, 0);
              const percents = distributePercent(serviceData.map(x => x.count));
              return serviceData.map((s, i) => (
                <ServiceRankRow
                  key={s.name}
                  rank={i + 1}
                  name={s.name}
                  count={s.count}
                  pct={total > 0 ? s.count / total : 0}
                  percent={percents[i]}
                  delay={0.18 + i * 0.07}
                />
              ));
            })()}
          </div>

        </motion.div>
      </div>

      {/* ── Bottom row: donut + weekly bar + stat widgets ── */}
      <div style={{ display: "grid", gridTemplateColumns: isLg ? "1fr 1fr 1fr" : isMd ? "1fr 1fr" : "1fr", gap: 16 }}>

        {/* Gauge circulaire — taux de remplissage du jour */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 3px" }}>
            Taux de remplissage
          </h2>
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>Aujourd'hui</p>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            {fillRate === "—" ? (
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>Pas encore de données</p>
            ) : (
              <CircularFillRate rate={dailyFillRate} />
            )}
          </div>
        </motion.div>

        {/* Weekly bar — ink tones */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 3px" }}>
            Cette semaine
          </h2>
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>Réservations par jour</p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={16} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0C0C0E" stopOpacity={0.80} />
                    <stop offset="100%" stopColor="#0C0C0E" stopOpacity={0.20} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(12,12,14,0.03)", radius: 4 }} />
                <Bar dataKey="bookings" name="RDV" fill="url(#gb)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Staff performance leaderboard */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
                Performance équipe
              </h2>
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>Ce mois — par RDV</p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "var(--ink-secondary)",
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: 6, padding: "3px 8px",
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
              flexShrink: 0,
            }}>
              {staffData.reduce((s, x) => s + x.bookings, 0)} RDV
            </span>
          </div>

          {/* Ranked rows */}
          <div style={{ marginTop: 8 }}>
            {staffData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>Pas encore de données sur cette période</p>
              </div>
            ) : (() => {
              const total    = staffData.reduce((s, x) => s + x.bookings, 0);
              const percents = distributePercent(staffData.map(x => x.bookings));
              return staffData.map((member, i) => (
                <motion.div
                  key={member.staffId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.38 + i * 0.07, duration: 0.38, ease: [0, 0, 0.2, 1] }}
                  style={{
                    paddingBlock: 10,
                    borderBottom: i < staffData.length - 1 ? "1px solid var(--hairline)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
                      color: "var(--ink-disabled)",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 18, flexShrink: 0,
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 500, color: "var(--ink)",
                      letterSpacing: "-0.01em", flex: 1,
                    }}>
                      {member.name}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: "var(--ink)",
                      letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
                    }}>
                      {member.bookings}
                    </span>
                    <span style={{
                      fontSize: 10, color: "var(--ink-tertiary)",
                      fontVariantNumeric: "tabular-nums", minWidth: 26, textAlign: "right",
                    }}>
                      {percents[i]}%
                    </span>
                  </div>
                  <div style={{ paddingLeft: 26 }}>
                    <div style={{ height: 3, backgroundColor: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${total > 0 ? (member.bookings / total) * 100 : 0}%` }}
                        transition={{ delay: 0.56 + i * 0.07, duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
                        style={{ height: "100%", borderRadius: 2, backgroundColor: BAR_COLORS[i] ?? "#8A8D93" }}
                      />
                    </div>
                  </div>
                </motion.div>
              ));
            })()}
          </div>

        </motion.div>
      </div>
    </DashboardLayout>
  );
}
