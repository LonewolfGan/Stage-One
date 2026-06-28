import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { TrendingUp, Users, Scissors, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";

const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const MOCK_WEEK = [
  { name: "Lun", bookings: 8  },
  { name: "Mar", bookings: 14 },
  { name: "Mer", bookings: 11 },
  { name: "Jeu", bookings: 18 },
  { name: "Ven", bookings: 22 },
  { name: "Sam", bookings: 28 },
  { name: "Dim", bookings: 6  },
];

const MOCK_MONTH = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 6 + Math.sin(i / 3) * 4 + Math.random() * 5;
  return {
    name: `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`,
    bookings: Math.round(base),
    revenue: Math.round(base * 320),
  };
});

const MOCK_SERVICES = [
  { name: "Coupe + Brushing", count: 48, color: "#D4466E", max: 48 },
  { name: "Soin kératine",    count: 31, color: "#0E7B6C", max: 48 },
  { name: "Coloration",       count: 27, color: "#8B5CF6", max: 48 },
  { name: "Manucure",         count: 21, color: "#E8A33D", max: 48 },
  { name: "Épilation",        count: 16, color: "#06B6D4", max: 48 },
];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--hairline)",
  backgroundColor: "var(--surface-1)",
  fontSize: 12,
  color: "var(--ink)",
  padding: "8px 12px",
};

function KpiCard({
  label, value, sub, delta, positive,
  icon: Icon, accent, sparkData,
}: {
  label: string; value: string; sub?: string; delta?: string; positive?: boolean;
  icon: React.ElementType; accent: string; sparkData: { v: number }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="ds-card"
      style={{ padding: 20, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", gap: 0 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} color={accent} />
        </div>
        {delta && (
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 600,
            color: positive ? "#10B981" : "#EF4444",
            backgroundColor: positive ? "#10B98115" : "#EF444415",
            padding: "3px 8px", borderRadius: 20,
          }}>
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{delta}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 3 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{sub}</span>}
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>{label}</p>

      {/* Sparkline */}
      <div style={{ height: 40, marginInline: -20, marginBottom: -20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`sk-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} fill={`url(#sk-${label})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ── Pill bar (like image 3) ── */
function PillBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const filled   = Math.round((value / max) * 7);
  const segments = 7;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--ink-secondary)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{value}</span>
      </div>
      <div style={{ display: "flex", gap: 3, height: 28 }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: i < filled ? color : "var(--surface-3)",
              transition: `background-color ${0.05 * i + 0.2}s ease`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--ink)", fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: 0, color: p.color ?? "var(--ink-secondary)", fontSize: 12 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ── "Today's Earning" mini-widget style (from ref image 1) ── */
function EarningWidget({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div
      className="ds-card"
      style={{ padding: "14px 16px", backgroundColor: color, border: "none", display: "flex", flexDirection: "column", gap: 4 }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: analytics } = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: () => api.getAnalytics(),
    staleTime: 60_000,
  });

  const totalBookings = analytics?.totalBookings ?? 107;
  const revenueMad    = analytics?.estimatedRevenueCents ? Math.round(analytics.estimatedRevenueCents / 100) : 32_400;
  const fillRate      = analytics?.fillRate ?? 73;

  const apiDays   = analytics?.bookingsByDay ?? [];
  const monthData = apiDays.length >= 10
    ? apiDays.slice(-30).map((x: any) => {
        const dt = new Date(x.date);
        return { name: `${dt.getDate()} ${MONTH_SHORT[dt.getMonth()]}`, bookings: x.count, revenue: x.count * 320 };
      })
    : MOCK_MONTH;

  const apiServices: any[] = analytics?.topServices ?? [];
  const serviceData = apiServices.length > 0
    ? apiServices.map((s, i) => ({ ...MOCK_SERVICES[i % MOCK_SERVICES.length], name: s.name, count: s.count }))
    : MOCK_SERVICES;

  const spark = (arr: { bookings: number }[]) => arr.slice(-12).map((d) => ({ v: d.bookings }));
  const sparkR = monthData.slice(-12).map((d) => ({ v: d.revenue / 100 }));
  const sparkF = Array.from({ length: 12 }, (_, i) => ({ v: 55 + Math.sin(i) * 20 }));
  const sparkC = Array.from({ length: 12 }, (_, i) => ({ v: 40 + Math.cos(i) * 12 }));

  return (
    <DashboardLayout title="Statistiques" breadcrumb="Statistiques">

      {/* ── Top widgets (inspired by image 1 top row) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Réservations (30 j)" value={`${totalBookings}`} delta="+12%" positive icon={TrendingUp} accent="#D4466E" sparkData={spark(monthData)} />
        <KpiCard label="CA estimé (30 j)" value={revenueMad.toLocaleString("fr-MA")} sub="MAD" delta="+8%" positive icon={Star} accent="#0E7B6C" sparkData={sparkR} />
        <KpiCard label="Taux de remplissage" value={`${fillRate}%`} delta="+5 pts" positive icon={Scissors} accent="#8B5CF6" sparkData={sparkF} />
        <KpiCard label="Clients ce mois" value="84" delta="+3" positive icon={Users} accent="#E8A33D" sparkData={sparkC} />
      </div>

      {/* ── Middle: area chart + pill bar chart (image 3 style) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Area chart — main */}
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
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>30 derniers jours</p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#D4466E" }} />
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Réservations</span>
              </div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ga-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4466E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D4466E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--hairline)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} interval={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="bookings" name="Réservations" stroke="#D4466E" strokeWidth={2} fill="url(#ga-main)" dot={false} activeDot={{ r: 4, fill: "#D4466E", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pill bar chart — image 3 style */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
              Prestations populaires
            </h2>
            <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>Ce mois — par volume</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {serviceData.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.35, ease: [0, 0, 0.2, 1] }}
              >
                <PillBar value={s.count} max={s.max} color={s.color} label={s.name} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom: donut + weekly bar + earning widgets ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Donut — fill rate */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 4px" }}>
            Taux de remplissage
          </h2>
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>Ce mois</p>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 160 }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <defs>
                  <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0E7B6C" />
                    <stop offset="100%" stopColor="#D4466E" />
                  </linearGradient>
                </defs>
                <Pie data={[{ value: fillRate }, { value: 100 - fillRate }]} cx="50%" cy="50%" innerRadius={50} outerRadius={66} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                  <Cell fill="url(#dg)" />
                  <Cell fill="var(--surface-3)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.025em", margin: 0 }}>{fillRate}%</p>
              <p style={{ fontSize: 10, color: "var(--ink-tertiary)", margin: 0 }}>occupé</p>
            </div>
          </div>
        </motion.div>

        {/* Weekly bar */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 4px" }}>
            Cette semaine
          </h2>
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 12px" }}>Réservations par jour</p>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_WEEK} barSize={18} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(12,12,14,0.03)", radius: 4 }} />
                <Bar dataKey="bookings" name="RDV" fill="url(#gb)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Earning widgets stack (image 1 style) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <EarningWidget label="CA aujourd'hui" value="1 080 MAD" color="#0E7B6C" sub="+12% vs hier" />
          <EarningWidget label="RDV aujourd'hui" value={`${totalBookings || 8}`} color="#D4466E" sub="sur 12 créneaux" />
          <div className="ds-card" style={{ padding: "14px 16px", flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: "0 0 6px" }}>
              Solde total
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
              {revenueMad.toLocaleString("fr-MA")} MAD
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10B981" }} />
              <span style={{ fontSize: 11, color: "#10B981", fontWeight: 500 }}>En hausse ce mois</span>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
