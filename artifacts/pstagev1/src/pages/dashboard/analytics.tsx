import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataCard } from "@/components/ui/DataCard";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const DAY_LABELS: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 0: "Dim" };
const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--hairline)",
  backgroundColor: "var(--surface-1)",
  fontSize: 13,
  color: "var(--ink)",
};

export default function AnalyticsPage() {
  const { data: analytics } = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: () => api.getAnalytics(),
    staleTime: 60_000,
  });

  const totalBookings = analytics?.totalBookings ?? 0;
  const revenueMad = analytics?.estimatedRevenueCents ? Math.round(analytics.estimatedRevenueCents / 100) : 0;
  const fillRate = analytics?.fillRate ?? 0;

  const allDays = analytics?.bookingsByDay ?? [];

  const last7 = (() => {
    const days: { name: string; bookings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = allDays.find((x: any) => x.date === key);
      days.push({ name: DAY_LABELS[d.getDay()], bookings: found?.count ?? 0 });
    }
    return days;
  })();

  const monthTrend = allDays.slice(-30).map((x: any) => ({
    name: `${parseInt(x.date.slice(8, 10))} ${MONTH_SHORT[parseInt(x.date.slice(5, 7)) - 1]}`,
    ca: 0,
    bookings: x.count,
  }));

  const topServices: { serviceId: string; name: string; count: number }[] = analytics?.topServices ?? [];
  const maxCount = topServices[0]?.count ?? 1;

  return (
    <DashboardLayout title="Statistiques" breadcrumb="Statistiques">
      <div className="dash-stat-grid" style={{ marginBottom: 24 }}>
        <DataCard
          label="Réservations (30j)"
          value={totalBookings}
          trend={totalBookings > 0 ? "up" : undefined}
          trendValue=""
        />
        <DataCard
          label="CA estimé (30j)"
          value={revenueMad.toLocaleString("fr-MA")}
          subValue="MAD"
          trend={revenueMad > 0 ? "up" : undefined}
          trendValue=""
        />
        <DataCard
          label="Taux de remplissage"
          value={`${fillRate}%`}
          trend={fillRate > 50 ? "up" : undefined}
          trendValue=""
        />
      </div>

      <div className="dash-chart-grid">
        <div className="ds-card">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 20, marginTop: 0 }}>
            Réservations cette semaine
          </h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} barSize={28}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(12,12,14,0.04)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ds-card">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 20, marginTop: 0 }}>
            Réservations (30 derniers jours)
          </h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthTrend}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }} interval={4} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-tertiary)", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="bookings" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--accent)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="ds-card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 16, marginTop: 0 }}>
          Prestations les plus demandées
        </h2>
        {topServices.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Aucune donnée disponible pour la période.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topServices.map(item => (
              <div key={item.serviceId}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--ink-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>{item.count} RDV</span>
                </div>
                <div style={{ height: 4, backgroundColor: "rgba(12,12,14,0.04)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.round((item.count / maxCount) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.0, 0.0, 0.2, 1], delay: 0.15 }}
                    style={{ height: "100%", backgroundColor: "var(--accent)", borderRadius: 99 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
