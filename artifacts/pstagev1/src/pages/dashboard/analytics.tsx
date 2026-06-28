import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, Legend,
} from "recharts";
import { TrendingUp, Users, Scissors, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";

const DAY_LABELS: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 0: "Dim" };
const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const MOCK_WEEK = [
  { name: "Lun", bookings: 8,  revenue: 2400 },
  { name: "Mar", bookings: 14, revenue: 4200 },
  { name: "Mer", bookings: 11, revenue: 3300 },
  { name: "Jeu", bookings: 18, revenue: 5400 },
  { name: "Ven", bookings: 22, revenue: 6600 },
  { name: "Sam", bookings: 28, revenue: 8400 },
  { name: "Dim", bookings: 6,  revenue: 1800 },
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
  { name: "Coupe + Brushing", count: 48, color: "#D4466E" },
  { name: "Soin kératine",    count: 31, color: "#E8A33D" },
  { name: "Coloration",       count: 27, color: "#8B5CF6" },
  { name: "Manucure",         count: 21, color: "#06B6D4" },
  { name: "Épilation",        count: 16, color: "#10B981" },
];

const FILL_DATA = [{ name: "Remplissage", value: 73, fill: "#D4466E" }];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--hairline)",
  backgroundColor: "var(--surface-1)",
  fontSize: 12,
  color: "var(--ink)",
  padding: "8px 12px",
};

function KpiCard({
  label,
  value,
  sub,
  delta,
  positive,
  icon: Icon,
  accent,
  sparkData,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  positive?: boolean;
  icon: React.ElementType;
  accent?: string;
  sparkData: { v: number }[];
}) {
  const color = accent ?? "#D4466E";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
      className="ds-card"
      style={{ display: "flex", flexDirection: "column", gap: 0, padding: 20, overflow: "hidden", position: "relative" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: color + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={16} color={color} />
        </div>
        {delta && (
          <span
            style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 11, fontWeight: 600,
              color: positive ? "#10B981" : "#EF4444",
              backgroundColor: positive ? "#10B98115" : "#EF444415",
              padding: "3px 7px", borderRadius: 20,
            }}
          >
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {delta}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{sub}</span>}
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>{label}</p>

      <div style={{ height: 44, marginTop: 14, marginInline: -20, marginBottom: -20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#spark-${label})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...tooltipStyle }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--ink)", fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: 0, color: p.color ?? "var(--ink-secondary)", fontSize: 12 }}>
          {p.name}: <strong>{typeof p.value === "number" && p.name?.toLowerCase().includes("ca") ? `${p.value.toLocaleString("fr-MA")} MAD` : p.value}</strong>
        </p>
      ))}
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
  const revenueMad = analytics?.estimatedRevenueCents
    ? Math.round(analytics.estimatedRevenueCents / 100)
    : 32_400;
  const fillRate = analytics?.fillRate ?? 73;

  const apiDays = analytics?.bookingsByDay ?? [];

  const weekData = MOCK_WEEK.map((d, i) => {
    const foundDay = apiDays.find((x: any) => {
      const dd = new Date(x.date);
      return dd.getDay() === (i + 1) % 7;
    });
    return { ...d, bookings: foundDay?.count ?? d.bookings };
  });

  const monthData = apiDays.length >= 10
    ? apiDays.slice(-30).map((x: any) => {
        const dt = new Date(x.date);
        return {
          name: `${dt.getDate()} ${MONTH_SHORT[dt.getMonth()]}`,
          bookings: x.count,
          revenue: x.count * 320,
        };
      })
    : MOCK_MONTH;

  const apiServices: any[] = analytics?.topServices ?? [];
  const serviceData = apiServices.length > 0
    ? apiServices.map((s, i) => ({ name: s.name, count: s.count, color: MOCK_SERVICES[i % MOCK_SERVICES.length].color }))
    : MOCK_SERVICES;
  const maxCount = serviceData[0]?.count ?? 1;

  const sparkBookings = monthData.slice(-14).map((d) => ({ v: d.bookings }));
  const sparkRevenue  = monthData.slice(-14).map((d) => ({ v: d.revenue }));
  const sparkFill     = Array.from({ length: 14 }, (_, i) => ({ v: 60 + Math.sin(i) * 18 }));
  const sparkClients  = Array.from({ length: 14 }, (_, i) => ({ v: 40 + Math.cos(i) * 15 }));

  return (
    <DashboardLayout title="Statistiques" breadcrumb="Statistiques">

      {/* KPI row */}
      <div className="dash-stat-grid" style={{ marginBottom: 20, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard
          label="Réservations (30 j)"
          value={totalBookings.toString()}
          delta="+12%"
          positive
          icon={TrendingUp}
          accent="#D4466E"
          sparkData={sparkBookings}
        />
        <KpiCard
          label="CA estimé (30 j)"
          value={revenueMad.toLocaleString("fr-MA")}
          sub="MAD"
          delta="+8%"
          positive
          icon={Star}
          accent="#E8A33D"
          sparkData={sparkRevenue}
        />
        <KpiCard
          label="Taux de remplissage"
          value={`${fillRate}%`}
          delta="+5 pts"
          positive={fillRate > 50}
          icon={Scissors}
          accent="#8B5CF6"
          sparkData={sparkFill}
        />
        <KpiCard
          label="Clients ce mois"
          value="84"
          delta="+3"
          positive
          icon={Users}
          accent="#06B6D4"
          sparkData={sparkClients}
        />
      </div>

      {/* Main charts row */}
      <div className="dash-chart-grid" style={{ marginBottom: 16 }}>
        {/* Revenue area chart */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
                Tendance des réservations
              </h2>
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>30 derniers jours</p>
            </div>
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, backgroundColor: "var(--accent-tint)", padding: "3px 10px", borderRadius: 20 }}>
              Mensuel
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-bookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4466E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#D4466E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#E8A33D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--hairline)" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }}
                  interval={5}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  name="Réservations"
                  stroke="#D4466E"
                  strokeWidth={2}
                  fill="url(#grad-bookings)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#D4466E", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weekly bar chart */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
                Réservations cette semaine
              </h2>
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>Par jour</p>
            </div>
            <span style={{ fontSize: 12, color: "#8B5CF6", fontWeight: 600, backgroundColor: "#8B5CF615", padding: "3px 10px", borderRadius: 20 }}>
              Semaine
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--hairline)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(12,12,14,0.03)", radius: 6 }} />
                <Bar dataKey="bookings" name="Réservations" fill="url(#grad-bar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom row: fill rate donut + top services */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>

        {/* Donut fill rate */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 4px" }}>
            Taux de remplissage
          </h2>
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "0 0 8px" }}>Ce mois</p>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 180 }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <defs>
                  <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#D4466E" />
                    <stop offset="100%" stopColor="#E8A33D" />
                  </linearGradient>
                </defs>
                <Pie
                  data={[
                    { value: fillRate },
                    { value: 100 - fillRate },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={68}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill="url(#donut-grad)" />
                  <Cell fill="var(--surface-3)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <p style={{ fontSize: 26, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", margin: 0 }}>
                {fillRate}%
              </p>
              <p style={{ fontSize: 10, color: "var(--ink-tertiary)", margin: 0 }}>occupé</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "linear-gradient(135deg,#D4466E,#E8A33D)" }} />
              <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Occupé</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "var(--surface-3)" }} />
              <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Libre</span>
            </div>
          </div>
        </motion.div>

        {/* Top services */}
        <motion.div
          className="ds-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
                Prestations populaires
              </h2>
              <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: "3px 0 0" }}>Par nombre de réservations</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {serviceData.map((item, index) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.07, duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 8, height: 8, borderRadius: "50%",
                          backgroundColor: item.color, flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "var(--ink-secondary)", fontWeight: 500 }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: item.color,
                        backgroundColor: item.color + "15",
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        {pct}%
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", minWidth: 36, textAlign: "right" }}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 5, backgroundColor: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: [0.0, 0.0, 0.2, 1], delay: 0.4 + index * 0.07 }}
                      style={{ height: "100%", backgroundColor: item.color, borderRadius: 99 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
