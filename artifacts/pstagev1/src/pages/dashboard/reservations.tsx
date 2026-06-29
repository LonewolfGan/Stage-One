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
  staff:   { id: string; name: string } | null;
  client:  { id: string; name: string } | null;
}

/* ── Adapter: ApiBooking → WeekCalendarBooking ── */
function toDecimalHour(iso: string | null | undefined, fallbackIso?: string): number {
  const d = new Date(iso ?? fallbackIso ?? "");
  if (isNaN(d.getTime())) return 9;
  const h = d.getUTCHours() + d.getUTCMinutes() / 60;
  // clamp to visible grid range so pills always appear on screen
  return Math.min(Math.max(h, HOUR_START_CLAMP), 18.75);
}
const HOUR_START_CLAMP = 8;

function toCalendarBooking(b: ApiBooking, dayIndex: number): WeekCalendarBooking {
  const durationH = (b.service?.durationMinutes ?? 60) / 60;
  const start     = toDecimalHour(b.startDatetime);
  const end       = toDecimalHour(b.endDatetime, b.startDatetime) || start + durationH;
  return {
    id:      b.id,
    dayIndex,
    start,
    end:     end > start ? end : start + durationH,
    title:   b.service?.name ?? "—",
    client:  b.client?.name  ?? "—",
    type:    b.service?.name ?? "default",
  };
}

/* ── Main page ── */
export default function ReservationsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [, navigate] = useLocation();

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const monday     = addWeeks(baseMonday, weekOffset);
  const days       = eachDayOfInterval({ start: monday, end: addDays(monday, 6) });

  const weekLabel = `${format(monday, "d MMM", { locale: fr })} – ${format(addDays(monday, 6), "d MMM yyyy", { locale: fr })}`;

  /* ── Fetch all 7 days in parallel ── */
  const { data: bookings = [], isLoading } = useQuery<WeekCalendarBooking[]>({
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

  return (
    <DashboardLayout title="Réservations" breadcrumb="Agenda" noPadding>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Week navigator bar ── */}
        <div style={{
          flexShrink: 0,
          padding: "12px 28px",
          borderBottom: "1px solid var(--hairline)",
          backgroundColor: "var(--canvas-pure)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/agenda")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 32, padding: "0 12px 0 8px",
              borderRadius: 9, border: "1px solid var(--hairline)",
              background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, color: "var(--ink-secondary)",
              letterSpacing: "-0.01em", transition: "background 120ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Agenda
          </button>

          {/* Week navigator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", minWidth: 160, textAlign: "center" }}>
              {isLoading
                ? <span style={{ display: "inline-block", width: 140, height: 14, borderRadius: 6, background: "var(--surface-3)", animation: "pulse 1.5s ease-in-out infinite" }} />
                : weekLabel}
            </span>

            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <ChevronRight size={15} />
            </button>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                style={{ height: 32, padding: "0 12px", borderRadius: 9, border: "1px solid var(--hairline)", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", transition: "background 120ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        {/* ── Week calendar grid ── */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <WeekCalendar days={days} bookings={bookings} isLoading={isLoading} />
        </div>

      </div>
    </DashboardLayout>
  );
}
