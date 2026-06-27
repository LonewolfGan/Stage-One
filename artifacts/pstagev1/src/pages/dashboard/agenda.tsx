import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/DSButton";
import { BookingBlock } from "@/components/dashboard/BookingBlock";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

const DAY_NAMES_LONG = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAY_NAMES_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(d: Date, short: boolean) {
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  return short ? `${day} ${month}` : `${DAY_NAMES_LONG[d.getDay()]} ${day} ${month}`;
}

export default function AgendaPage() {
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);
  const { isMobile } = useBreakpoint();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateStr = toDateStr(currentDate);

  const { data: bookings = [] } = useQuery({
    queryKey: ["dashboard", "bookings", dateStr],
    queryFn: () => api.getDashboardBookings({ date: dateStr }),
    staleTime: 30_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: () => api.getAnalytics(),
    staleTime: 60_000,
  });

  const { data: providerData } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
  });

  const staffNames: string[] = providerData?.staff?.map((s: any) => s.name) ?? [];

  const todayBookings = bookings.length;
  const estimatedRevenue = analytics?.estimatedRevenueCents
    ? Math.round(analytics.estimatedRevenueCents / 100)
    : 0;
  const fillRate = analytics?.fillRate ?? 0;

  function prevDay() {
    setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; });
  }
  function nextDay() {
    setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; });
  }
  function goToday() { setCurrentDate(new Date()); }

  const adaptedBookings = bookings.map((b: any) => {
    const start = new Date(b.startDatetime);
    return {
      id: b.id,
      clientName: b.client?.name ?? "Client",
      service: b.service?.name ?? "Prestation",
      staff: b.staff?.name ?? "",
      time: `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`,
      duration: b.service?.durationMinutes ?? 30,
      amount: Math.round((b.amountCents ?? 0) / 100),
      status: b.status === "CONFIRMED" || b.status === "COMPLETED" ? "confirmed" : "pending",
    };
  });

  const displayStaff = staffNames.length > 0 ? staffNames : ["—"];

  return (
    <DashboardLayout
      title="Agenda"
      breadcrumb="Agenda"
      actions={
        <>
          <div style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(12,12,14,0.04)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "2px 4px",
            gap: 2,
          }}>
            <button onClick={prevDay} style={{ padding: "4px 6px", background: "none", border: "none", cursor: "pointer", borderRadius: 6, color: "var(--ink-secondary)", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ paddingInline: 8, fontSize: 13, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap" }}>
              {formatDateLabel(currentDate, isMobile)}
            </span>
            <button onClick={nextDay} style={{ padding: "4px 6px", background: "none", border: "none", cursor: "pointer", borderRadius: 6, color: "var(--ink-secondary)", display: "flex", alignItems: "center" }}>
              <ChevronRight size={16} />
            </button>
          </div>
          {!isMobile && (
            <Button variant="ghost" size="sm" icon={<Calendar size={13} />} onClick={goToday}>
              Aujourd'hui
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={13} />}
            style={{ backgroundColor: "var(--accent-tint)", color: "var(--accent)", border: "1px solid var(--accent-hairline)" }}
          >
            {isMobile ? "Bloquer" : "Bloquer créneau"}
          </Button>
        </>
      }
    >
      <div className="dash-stat-grid" style={{ marginBottom: 20 }}>
        <DataCard label="Aujourd'hui" value={`${todayBookings}`} subValue="RDV" />
        <DataCard label="CA 30 jours" value={estimatedRevenue.toLocaleString("fr-MA")} subValue="MAD" trend="up" trendValue="" />
        <DataCard label="Remplissage" value={`${fillRate}%`} trend={fillRate > 50 ? "up" : undefined} trendValue="" />
      </div>

      <div className="ds-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: 560 }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--hairline)", backgroundColor: "rgba(12,12,14,0.03)", flexShrink: 0 }}>
          <div style={{ width: 56, flexShrink: 0, borderRight: "1px solid var(--hairline)" }} />
          {displayStaff.map(name => (
            <div
              key={name}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 8px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-secondary)",
                borderRight: "1px solid var(--hairline)",
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name.split(" ")[0]}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          <div style={{ minWidth: 360 }}>
            {hours.map(hour => (
              <div key={hour} style={{ display: "flex", borderBottom: "1px solid var(--hairline)", height: 72 }}>
                <div style={{
                  width: 56, flexShrink: 0, borderRight: "1px solid var(--hairline)",
                  display: "flex", justifyContent: "center", paddingTop: 8,
                  fontSize: 11, color: "var(--ink-disabled)", fontWeight: 500, letterSpacing: "0.01em",
                }}>
                  {hour}:00
                </div>
                {displayStaff.map(name => (
                  <div
                    key={`${hour}-${name}`}
                    style={{
                      flex: 1,
                      minWidth: 80,
                      borderRight: "1px solid var(--hairline)",
                      position: "relative",
                      padding: 3,
                      cursor: "pointer",
                      transition: "background-color var(--ease-fast)",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(12,12,14,0.04)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                  >
                    {adaptedBookings.filter(
                      b => b.staff === name && parseInt(b.time.split(":")[0]) === hour
                    ).map(booking => (
                      <BookingBlock key={booking.id} booking={booking} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
