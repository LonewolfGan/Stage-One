import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/DSButton";
import { BookingBlock } from "@/components/dashboard/BookingBlock";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, Plus, Calendar, X, Lock } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useSlotSync } from "@/hooks/useSlotSync";
import { useBookingNotifications } from "@/hooks/useBookingNotifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MONTHS = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];
const DAY_NAMES_LONG = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(d: Date, short: boolean) {
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  return short ? `${day} ${month}` : `${DAY_NAMES_LONG[d.getDay()]} ${day} ${month}`;
}

const BLOCK_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1h", value: 60 },
  { label: "1h30", value: 90 },
  { label: "2h", value: 120 },
];

interface BlockModal {
  staffId: string;
  staffName: string;
  hour: number;
  date: string;
}

export default function AgendaPage() {
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);
  const { isMobile } = useBreakpoint();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockModal, setBlockModal] = useState<BlockModal | null>(null);
  const [blockDuration, setBlockDuration] = useState(60);
  const [blockReason, setBlockReason] = useState("");

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

  const staffList: Array<{ id: string; name: string }> = providerData?.staff ?? [];
  const providerId: string | undefined = providerData?.id;

  // Real-time WebSocket hooks
  useSlotSync(providerId, dateStr);
  useBookingNotifications(providerId);

  const createBlockMutation = useMutation({
    mutationFn: () => {
      const start = new Date(currentDate);
      start.setHours(blockModal!.hour, 0, 0, 0);
      const end = new Date(start.getTime() + blockDuration * 60_000);
      return api.createBlock({
        staffId: blockModal!.staffId,
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        title: blockReason || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "bookings"] });
      setBlockModal(null);
      setBlockReason("");
      setBlockDuration(60);
    },
  });

  function prevDay() {
    setCurrentDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; });
  }
  function nextDay() {
    setCurrentDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; });
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

  const displayStaff = staffList.length > 0 ? staffList : [{ id: "", name: "—" }];

  const todayBookings = bookings.length;
  const estimatedRevenue = analytics?.estimatedRevenueCents
    ? Math.round(analytics.estimatedRevenueCents / 100)
    : 0;
  const fillRate = analytics?.fillRate ?? 0;

  return (
    <DashboardLayout
      title="Agenda"
      breadcrumb="Agenda"
      actions={
        <>
          <div style={{
            display: "flex", alignItems: "center",
            backgroundColor: "rgba(12,12,14,0.04)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "2px 4px", gap: 2,
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
            onClick={() => {
              const firstStaff = staffList[0];
              if (firstStaff) {
                setBlockModal({ staffId: firstStaff.id, staffName: firstStaff.name, hour: 9, date: dateStr });
              }
            }}
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
        {/* Header row */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--hairline)", backgroundColor: "rgba(12,12,14,0.03)", flexShrink: 0 }}>
          <div style={{ width: 56, flexShrink: 0, borderRight: "1px solid var(--hairline)" }} />
          {displayStaff.map((member) => (
            <div
              key={member.id || member.name}
              style={{
                flex: 1, textAlign: "center", padding: "10px 8px",
                fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)",
                borderRight: "1px solid var(--hairline)",
                letterSpacing: "0.01em", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {member.name.split(" ")[0]}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          <div style={{ minWidth: 360 }}>
            {hours.map((hour) => (
              <div key={hour} style={{ display: "flex", borderBottom: "1px solid var(--hairline)", height: 72 }}>
                <div style={{
                  width: 56, flexShrink: 0, borderRight: "1px solid var(--hairline)",
                  display: "flex", justifyContent: "center", paddingTop: 8,
                  fontSize: 11, color: "var(--ink-disabled)", fontWeight: 500, letterSpacing: "0.01em",
                }}>
                  {hour}:00
                </div>
                {displayStaff.map((member) => {
                  const cellBookings = adaptedBookings.filter(
                    (b) => b.staff === member.name && parseInt(b.time.split(":")[0]) === hour,
                  );
                  const hasBooking = cellBookings.length > 0;

                  return (
                    <div
                      key={`${hour}-${member.id || member.name}`}
                      style={{
                        flex: 1, minWidth: 80, borderRight: "1px solid var(--hairline)",
                        position: "relative", padding: 3,
                        cursor: member.id && !hasBooking ? "pointer" : "default",
                        transition: "background-color var(--ease-fast)",
                      }}
                      onMouseEnter={(e) => {
                        if (member.id && !hasBooking) {
                          (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(212,70,110,0.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                      }}
                      onClick={() => {
                        if (member.id && !hasBooking) {
                          setBlockModal({ staffId: member.id, staffName: member.name, hour, date: dateStr });
                          setBlockDuration(60);
                          setBlockReason("");
                        }
                      }}
                      title={member.id && !hasBooking ? `Bloquer ${hour}:00 — ${member.name.split(" ")[0]}` : undefined}
                    >
                      {cellBookings.map((booking) => (
                        <BookingBlock key={booking.id} booking={booking} />
                      ))}
                      {member.id && !hasBooking && (
                        <div style={{
                          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: 0, transition: "opacity var(--ease-fast)",
                        }}
                          className="block-hint"
                        >
                          <Lock size={11} style={{ color: "var(--ink-disabled)" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Block creation modal */}
      {blockModal && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={() => setBlockModal(null)}
        >
          <div
            className="ds-card"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>Bloquer ce créneau</h3>
              <button onClick={() => setBlockModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 8 }}>
                {blockModal.staffName.split(" ")[0]} · {format(currentDate, "d MMMM yyyy", { locale: fr })} à {blockModal.hour}:00
              </p>
            </div>

            {/* Duration picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>Durée</label>
              <div style={{ display: "flex", gap: 8 }}>
                {BLOCK_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setBlockDuration(d.value)}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: "var(--radius-control)",
                      border: `1px solid ${blockDuration === d.value ? "var(--accent)" : "var(--hairline)"}`,
                      backgroundColor: blockDuration === d.value ? "var(--accent-tint)" : "transparent",
                      color: blockDuration === d.value ? "var(--accent)" : "var(--ink)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      transition: "border-color var(--ease), background-color var(--ease)",
                      fontFamily: "var(--font)",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>Motif (optionnel)</label>
              <input
                type="text"
                placeholder="Ex : Pause déjeuner, Formation…"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)", fontSize: 14, color: "var(--ink)",
                  backgroundColor: "var(--canvas-pure)", outline: "none", fontFamily: "var(--font)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setBlockModal(null)}
                style={{ flex: 1, padding: "10px 16px", border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)", background: "var(--canvas-pure)", fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: "pointer" }}
              >
                Annuler
              </button>
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
                disabled={createBlockMutation.isPending}
                onClick={() => createBlockMutation.mutate()}
              >
                {createBlockMutation.isPending ? "Blocage…" : "Bloquer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
