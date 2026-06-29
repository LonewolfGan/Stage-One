import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, Plus, ArrowUpRight, X, Lock, Scissors, User } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useSlotSync } from "@/hooks/useSlotSync";
import { useBookingNotifications } from "@/hooks/useBookingNotifications";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const BLOCK_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1h",     value: 60 },
  { label: "1h30",   value: 90 },
  { label: "2h",     value: 120 },
];

interface BlockModal {
  staffId: string;
  staffName: string;
  hour: number;
  date: string;
}

/* ── Status system — single source of truth ── */
const STATUS_CONFIG = {
  confirmed:  { color: "#33CA7F", bg: "rgba(51,202,127,0.10)",  border: "rgba(51,202,127,0.22)",  label: "Confirmé"   },
  pending:    { color: "#EC8932", bg: "rgba(236,137,50,0.10)",  border: "rgba(236,137,50,0.22)",  label: "En attente" },
  cancelled:  { color: "#DC0470", bg: "rgba(220,4,112,0.10)",   border: "rgba(220,4,112,0.22)",   label: "Annulé"     },
  completed:  { color: "#0C0C0E", bg: "rgba(12,12,14,0.06)",    border: "rgba(12,12,14,0.16)",    label: "Terminé"    },
} as const;

type BookingStatus = keyof typeof STATUS_CONFIG;

interface BookingEntry {
  id: string;
  clientName: string;
  service: string;
  time: string;
  duration: number;
  amount: number;
  status: BookingStatus;
}

function avatarInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#33CA7F", "#EC8932", "#DC0470", "#0C0C0E", "#6B8CFF", "#B06DCC"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/* ── Full-month mini calendar ── */
function MonthCalendar({
  selected,
  onSelect,
  bookingDates,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  bookingDates: string[];
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selected);
    d.setDate(1);
    return d;
  });

  const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(endOfMonth(viewMonth),     { weekStartsOn: 1 });
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function hasBooking(d: Date) {
    const s = d.toISOString().slice(0, 10);
    return bookingDates.includes(s);
  }

  return (
    <div>
      {/* Month nav — Figma style: arrow · month name · arrow */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          type="button"
          aria-label="Mois précédent"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          style={{ width: 34, height: 34, border: "1px solid var(--hairline)", borderRadius: 10, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {format(viewMonth, "MMMM", { locale: fr }).replace(/^\w/, (c) => c.toUpperCase())}
        </span>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          style={{ width: 34, height: 34, border: "1px solid var(--hairline)", borderRadius: 10, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)", transition: "background 120ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", paddingBottom: 8 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "var(--hairline)", marginBottom: 8 }} />

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {days.map((day, i) => {
          const inMonth  = isSameMonth(day, viewMonth);
          const isSel    = isSameDay(day, selected);
          const today    = isToday(day);
          const hasBk    = hasBooking(day);

          return (
            <button
              key={i}
              onClick={() => { if (inMonth) onSelect(day); }}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                border: "none",
                cursor: inMonth ? "pointer" : "default",
                backgroundColor: isSel
                  ? "#D4466E"
                  : today && !isSel
                  ? "#D4466E14"
                  : "transparent",
                color: isSel
                  ? "#fff"
                  : !inMonth
                  ? "var(--ink-disabled)"
                  : today
                  ? "#D4466E"
                  : "var(--ink)",
                fontSize: 13,
                fontWeight: isSel || today ? 700 : 400,
                transition: "background-color 120ms",
                gap: 2,
              }}
            >
              {day.getDate()}
              {hasBk && inMonth && (
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  backgroundColor: isSel ? "rgba(255,255,255,0.75)" : "#D4466E",
                  position: "absolute",
                  bottom: 4,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Timeline event block ── */
function TimelineEvent({ b, index }: { b: BookingEntry; index: number }) {
  const st = STATUS_CONFIG[b.status as BookingStatus] ?? STATUS_CONFIG.pending;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
      style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 4 }}
    >
      {/* Time label */}
      <div style={{ width: 38, flexShrink: 0, textAlign: "right", paddingTop: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", lineHeight: 1 }}>
          {b.time.split(" – ")[0]}
        </span>
      </div>

      {/* Dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: st.color, marginTop: 13, flexShrink: 0 }} />
        <div style={{ flex: 1, width: 1, backgroundColor: "var(--hairline)", marginTop: 4 }} />
      </div>

      {/* Card */}
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--hairline)",
          borderRadius: 10,
          padding: "9px 12px",
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {b.service}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: "var(--ink)", opacity: 0.12,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 7, fontWeight: 700, color: "var(--ink)",
                flexShrink: 0,
              }}>
                <span style={{ opacity: 1 / 0.12, color: "var(--ink)" }}>{avatarInitials(b.clientName)}</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-secondary)", fontWeight: 500 }}>{b.clientName}</span>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: st.color,
            backgroundColor: st.bg,
            border: `1px solid ${st.border}`,
            padding: "3px 8px", borderRadius: 20, flexShrink: 0, marginLeft: 8,
          }}>
            {st.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Booking card (left panel) ── */
function BookingCard({ b, index }: { b: BookingEntry; index: number }) {
  const st = STATUS_CONFIG[b.status as BookingStatus] ?? STATUS_CONFIG.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07, duration: 0.38, ease: [0, 0, 0.2, 1] }}
      className="ds-card"
      style={{ padding: "14px 16px", cursor: "pointer" }}
    >
      {/* Service name */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
          {b.service}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, fontWeight: 400, fontFeatureSettings: '"tnum"' }}>
          {b.time} · {b.duration} min
        </p>
      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "var(--hairline)", marginBottom: 10 }} />

      {/* Client + amount */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            backgroundColor: "rgba(12,12,14,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "var(--ink)", flexShrink: 0,
          }}>
            {avatarInitials(b.clientName)}
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{b.clientName}</p>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", fontFeatureSettings: '"tnum"', flexShrink: 0 }}>
          {b.amount.toLocaleString("fr-MA")}{" "}
          <span style={{ fontSize: 10, color: "var(--ink-tertiary)", fontWeight: 400 }}>MAD</span>
        </span>
      </div>
    </motion.div>
  );
}

function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }

export default function AgendaPage() {
  const { isMobile, isLg } = useBreakpoint();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
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

  const todayBookings = bookings.length;
  const fillRate      = analytics?.fillRate ?? 0;

  const adaptedBookings: BookingEntry[] = bookings.map((b: any) => {
    const start = new Date(b.startDatetime);
    const end   = new Date(b.endDatetime ?? b.startDatetime);
    return {
      id: b.id,
      clientName: b.client?.name ?? "Client",
      service: b.service?.name ?? "Prestation",
      time: `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
      duration: b.service?.durationMinutes ?? 60,
      amount: Math.round((b.amountCents ?? 0) / 100),
      status: (
        b.status === "CONFIRMED" ? "confirmed" :
        b.status === "COMPLETED" ? "completed" :
        b.status === "CANCELLED" ? "cancelled" :
        "pending"
      ) as BookingStatus,
    };
  });

  const bookingDates = [dateStr];

  return (
    <DashboardLayout
      title="Agenda"
      breadcrumb="Agenda"
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={13} />}
            style={{ backgroundColor: "var(--accent-tint)", color: "var(--accent)", border: "1px solid rgba(212,70,110,0.2)" }}
            onClick={() => {
              const firstStaff = staffList[0];
              if (firstStaff) setBlockModal({ staffId: firstStaff.id, staffName: firstStaff.name, hour: 9, date: dateStr });
            }}
          >
            Bloquer créneau
          </Button>
        </>
      }
    >
      {/* ── Split layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: isLg ? "1fr 300px" : "1fr", gap: 20, alignItems: "start" }}>

        {/* ── LEFT: Date header + booking cards ── */}
        <div>
          {/* Date headline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
                {format(currentDate, "d MMMM", { locale: fr })},{" "}
                <span style={{ color: "var(--ink-tertiary)", fontWeight: 400 }}>
                  {format(currentDate, "EEEE", { locale: fr })}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setCurrentDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; })}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--hairline)", background: "var(--surface-1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)" }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(212,70,110,0.25)", background: "rgba(212,70,110,0.07)", cursor: "pointer" }}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setCurrentDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; })}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--hairline)", background: "var(--surface-1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)" }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "RDV aujourd'hui", display: `${todayBookings ?? adaptedBookings.length}`, sub: "réservations", color: "#D4466E" },
              { label: "CA estimé", display: `${adaptedBookings.reduce((s, b) => s + b.amount, 0).toLocaleString("fr-MA")}`, sub: "MAD", color: "#0E7B6C" },
              { label: "Remplissage", display: `${fillRate ?? 73}`, sub: "%", color: "#8B5CF6" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
                className="ds-card"
                style={{ padding: "16px 18px" }}
              >
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: 0 }}>
                    {s.label}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.display}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)", fontWeight: 400 }}>{s.sub}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Booking cards */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
              Réservations du jour
            </h3>
            <button
              type="button"
              onClick={() => navigate("/dashboard/agenda/bookings")}
              style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", padding: 0 }}
            >
              Tout voir <ArrowUpRight size={12} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
            {adaptedBookings.length > 0 ? (
              adaptedBookings.map((b, i) => (
                <BookingCard key={b.id} b={b} index={i} />
              ))
            ) : (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Scissors size={20} color="var(--ink-tertiary)" strokeWidth={1.5} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Aucune réservation</p>
                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>Aucun rendez-vous prévu ce jour</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Calendar + timeline ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Month calendar */}
          <div className="ds-card" style={{ padding: 16 }}>
            <MonthCalendar
              selected={currentDate}
              onSelect={setCurrentDate}
              bookingDates={bookingDates}
            />
          </div>

          {/* Timeline */}
          <div className="ds-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: "0 0 16px" }}>
              Chronologie
            </h3>
            <div>
              {adaptedBookings.length > 0 ? (
                adaptedBookings.map((b, i) => (
                  <TimelineEvent key={b.id} b={b} index={i} />
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>Aucun événement ce jour</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block creation modal */}
      {blockModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(4px)" }}
          onClick={() => setBlockModal(null)}
        >
          <div className="ds-card" style={{ maxWidth: 400, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>Bloquer ce créneau</h3>
              <button onClick={() => setBlockModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 16 }}>
              {blockModal.staffName.split(" ")[0]} · {format(currentDate, "d MMMM yyyy", { locale: fr })} à {blockModal.hour}:00
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>Durée</label>
              <div style={{ display: "flex", gap: 8 }}>
                {BLOCK_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setBlockDuration(d.value)}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: "var(--radius-control)",
                      border: `1px solid ${blockDuration === d.value ? "var(--ink)" : "var(--hairline)"}`,
                      backgroundColor: blockDuration === d.value ? "var(--ink)" : "transparent",
                      color: blockDuration === d.value ? "#FFFFFF" : "var(--ink)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      fontFamily: "var(--font)",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>Motif (optionnel)</label>
              <input
                type="text"
                placeholder="Ex : Pause déjeuner, Formation…"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)", fontSize: 14, color: "var(--ink)", backgroundColor: "var(--canvas-pure)", outline: "none", fontFamily: "var(--font)", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setBlockModal(null)} style={{ flex: 1, padding: "10px 16px", border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)", background: "var(--canvas-pure)", fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: "pointer" }}>
                Annuler
              </button>
              <Button variant="primary" size="sm" style={{ flex: 1 }} disabled={createBlockMutation.isPending} onClick={() => createBlockMutation.mutate()}>
                {createBlockMutation.isPending ? "Blocage…" : "Bloquer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
