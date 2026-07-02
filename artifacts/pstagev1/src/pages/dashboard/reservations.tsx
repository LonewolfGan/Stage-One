import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import WeekCalendar, { type WeekCalendarBooking } from "@/components/dashboard/WeekCalendar";
import { api } from "@/lib/api";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, startOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { fr } from "date-fns/locale";

/* ── API response type ── */
interface ApiBooking {
  id: string;
  startDatetime: string;
  endDatetime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "EXPIRED";
  amountCents: number;
  service: { id: string; name: string; durationMinutes: number; type?: string } | null;
  staff:   { id: string; name: string; firstName?: string; lastName?: string } | null;
  client:  { id: string; name: string } | null;
}

/* ── Adapter: ApiBooking → WeekCalendarBooking ── */
function toDecimalHour(iso: string | null | undefined, fallbackIso?: string): number {
  const d = new Date(iso ?? fallbackIso ?? "");
  if (isNaN(d.getTime())) return 9;
  const h = d.getUTCHours() + d.getUTCMinutes() / 60;
  return Math.min(Math.max(h, HOUR_START_CLAMP), 18.75);
}
const HOUR_START_CLAMP = 8;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function toCalendarBooking(b: ApiBooking, dayIndex: number): WeekCalendarBooking {
  const durationMinutes = b.service?.durationMinutes ?? 60;
  const durationH       = durationMinutes / 60;
  const start           = toDecimalHour(b.startDatetime);
  const end             = toDecimalHour(b.endDatetime, b.startDatetime) || start + durationH;
  const clientName      = b.client?.name ?? "—";
  const staffName       = b.staff?.name ?? (
    b.staff ? [b.staff.firstName, b.staff.lastName].filter(Boolean).join(" ") : undefined
  );
  return {
    id:             b.id,
    dayIndex,
    start,
    end:            end > start ? end : start + durationH,
    title:          b.service?.name ?? "—",
    client:         clientName,
    clientInitials: clientName !== "—" ? getInitials(clientName) : "?",
    type:           b.service?.name ?? "default",
    status:         b.status,
    amountCents:    b.amountCents,
    staffName,
    staffId:        b.staff?.id,
    durationMinutes,
    startIso:       b.startDatetime,
    endIso:         b.endDatetime,
  };
}

/* ── Main page ── */
export default function ReservationsPage() {
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monday     = addWeeks(baseMonday, weekOffset);
  const days       = eachDayOfInterval({ start: monday, end: addDays(monday, 6) });

  const weekLabel = `${format(monday, "d MMM", { locale: fr })} – ${format(addDays(monday, 6), "d MMM yyyy", { locale: fr })}`;

  /* ── Staff list ── */
  const { data: providerData } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn:  () => api.getDashboardProvider(),
    staleTime: 300_000,
  });
  const staffList: Array<{ id: string; name: string }> = providerData?.staff ?? [];

  /* ── Fetch all 7 days in parallel ── */
  const { data: allBookings = [], isLoading } = useQuery<WeekCalendarBooking[]>({
    queryKey: ["dashboard-week-bookings", weekOffset],
    queryFn: async () => {
      const results = await Promise.all(
        days.map((day, dayIndex) =>
          api
            .get<ApiBooking[]>(`/dashboard/bookings?date=${format(day, "yyyy-MM-dd")}`)
            .then((list) => list.map((b) => toCalendarBooking(b, dayIndex)))
            .catch(() => [] as WeekCalendarBooking[]),
        ),
      );
      return results.flat();
    },
    staleTime: 30_000,
  });

  /* ── Client-side staff filter ── */
  const bookings = selectedStaffId
    ? allBookings.filter((b) => b.staffId === selectedStaffId)
    : allBookings;

  return (
    <DashboardLayout title="Réservations" breadcrumb="Agenda" noPadding>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Toolbar : retour + nav semaine + filtres équipe (une seule ligne) ── */}
        <div style={{
          flexShrink: 0,
          padding: "10px 20px",
          backgroundColor: "var(--canvas-pure)",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
        }}>

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/agenda")}
            style={{
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 5,
              height: 32, padding: "0 11px 0 8px",
              borderRadius: 9, border: "1px solid var(--hairline)",
              background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)",
              letterSpacing: "-0.01em", transition: "background 120ms",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Agenda
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 20, backgroundColor: "var(--hairline)", flexShrink: 0 }} />

          {/* Week navigator */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", minWidth: 148, textAlign: "center", whiteSpace: "nowrap" }}>
              {isLoading
                ? <span style={{ display: "inline-block", width: 120, height: 12, borderRadius: 6, background: "var(--surface-3)", animation: "pulse 1.5s ease-in-out infinite" }} />
                : weekLabel}
            </span>

            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <ChevronRight size={14} />
            </button>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                style={{ height: 30, padding: "0 10px", borderRadius: 8, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", transition: "background 120ms", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Aujourd'hui
              </button>
            )}
          </div>

          {/* Divider — only if staff chips exist */}
          {staffList.length > 0 && (
            <div style={{ width: 1, height: 20, backgroundColor: "var(--hairline)", flexShrink: 0 }} />
          )}

          {/* Staff filter chips — scrollable, takes remaining space */}
          {staffList.length > 0 && (
            <div style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 5,
              overflowX: "auto",
              scrollbarWidth: "none",
              /* hide scrollbar on webkit */
              msOverflowStyle: "none",
            } as React.CSSProperties}>
              {[{ id: null, name: "Tous" }, ...staffList].map((s) => {
                const active = selectedStaffId === s.id;
                return (
                  <button
                    key={s.id ?? "all"}
                    type="button"
                    onClick={() => setSelectedStaffId(s.id)}
                    style={{
                      flexShrink: 0,
                      height: 28,
                      padding: "0 11px",
                      borderRadius: 14,
                      border: `1px solid ${active ? "var(--ink)" : "var(--hairline)"}`,
                      backgroundColor: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--canvas)" : "var(--ink-secondary)",
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      letterSpacing: "-0.01em",
                      transition: "background 120ms, color 120ms, border-color 120ms",
                      fontFamily: "var(--font)",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Week calendar grid ── */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <WeekCalendar days={days} bookings={bookings} isLoading={isLoading} />
        </div>

      </div>
    </DashboardLayout>
  );
}
