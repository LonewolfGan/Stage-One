import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const MOCK_BOOKINGS = [
  { id: "m1", clientName: "Yasmine Alaoui",  service: "Coupe + Brushing",  time: "09:00 – 10:30", duration: 90,  amount: 250, status: "confirmed", tags: ["Coiffure"], color: "#D4466E" },
  { id: "m2", clientName: "Sara Benali",     service: "Soin kératine",     time: "11:00 – 12:30", duration: 90,  amount: 480, status: "confirmed", tags: ["Soin"],     color: "#06B6D4" },
  { id: "m3", clientName: "Nadia Fassi",     service: "Coloration racines", time: "14:00 – 15:00", duration: 60,  amount: 320, status: "pending",   tags: ["Couleur"],  color: "#8B5CF6" },
  { id: "m4", clientName: "Kenza Moussaoui", service: "Manucure gel",       time: "15:30 – 16:30", duration: 60,  amount: 180, status: "confirmed", tags: ["Beauté"],   color: "#E8A33D" },
  { id: "m5", clientName: "Leila Bouzid",    service: "Massage détente",    time: "17:00 – 18:00", duration: 60,  amount: 350, status: "confirmed", tags: ["Bien-être"],$color: "#10B981" },
];

function avatarInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#D4466E", "#06B6D4", "#8B5CF6", "#E8A33D", "#10B981", "#F97316"];
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

  const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const gridEnd   = endOfWeek(endOfMonth(viewMonth),     { weekStartsOn: 0 });
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function hasBooking(d: Date) {
    const s = d.toISOString().slice(0, 10);
    return bookingDates.includes(s);
  }

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {format(viewMonth, "MMMM yyyy", { locale: fr })}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            style={{ width: 28, height: 28, border: "1px solid var(--hairline)", borderRadius: 8, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)" }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            style={{ width: 28, height: 28, border: "1px solid var(--hairline)", borderRadius: 8, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-secondary)" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", paddingBottom: 6 }}>
            {d}
          </div>
        ))}
      </div>

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
              onClick={() => { onSelect(day); }}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "none",
                cursor: inMonth ? "pointer" : "default",
                backgroundColor: isSel
                  ? "#0E7B6C"
                  : today && !isSel
                  ? "#0E7B6C18"
                  : "transparent",
                color: isSel
                  ? "#fff"
                  : !inMonth
                  ? "var(--ink-disabled)"
                  : today
                  ? "#0E7B6C"
                  : "var(--ink)",
                fontSize: 12,
                fontWeight: isSel || today ? 600 : 400,
                transition: "background-color 120ms",
                gap: 2,
              }}
            >
              {day.getDate()}
              {hasBk && inMonth && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  backgroundColor: isSel ? "rgba(255,255,255,0.7)" : "#D4466E",
                  position: "absolute",
                  bottom: 3,
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
function TimelineEvent({ b, index }: { b: typeof MOCK_BOOKINGS[0]; index: number }) {
  const isConfirmed = b.status === "confirmed";
  const color       = (b as any).color ?? "#D4466E";
  const bg          = color + "12";
  const border      = color + "30";

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "stretch",
        marginBottom: 6,
      }}
    >
      {/* Time label */}
      <div style={{ width: 76, flexShrink: 0, textAlign: "right", paddingTop: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", lineHeight: 1 }}>
          {b.time.split(" – ")[0]}
        </span>
      </div>

      {/* Colored dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, marginTop: 11, flexShrink: 0, border: `2px solid ${color}40` }} />
        <div style={{ flex: 1, width: 1.5, backgroundColor: "var(--hairline)", marginTop: 4 }} />
      </div>

      {/* Card */}
      <div
        style={{
          flex: 1,
          backgroundColor: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color, borderRadius: "0 2px 2px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {b.service}
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: "0 0 8px" }}>{b.time}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: avatarColor(b.clientName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "#fff",
                }}>
                  {avatarInitials(b.clientName)}
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-secondary)", fontWeight: 500 }}>{b.clientName}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 8 }}>
            {b.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10, fontWeight: 600,
                  color: color,
                  backgroundColor: color + "15",
                  padding: "3px 8px", borderRadius: 20,
                  whiteSpace: "nowrap",
                }}
              >
                {tag}
              </span>
            ))}
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: isConfirmed ? "#10B981" : "#E8A33D",
              backgroundColor: isConfirmed ? "#10B98115" : "#E8A33D15",
              padding: "3px 8px", borderRadius: 20,
            }}>
              {isConfirmed ? "Confirmé" : "En attente"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Booking card (left panel) ── */
function BookingCard({ b, index }: { b: typeof MOCK_BOOKINGS[0]; index: number }) {
  const isConfirmed = b.status === "confirmed";
  const color       = (b as any).color ?? "#D4466E";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07, duration: 0.38, ease: [0, 0, 0.2, 1] }}
      className="ds-card"
      style={{ padding: 16, cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {b.service}
          </p>
          <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>{b.time}</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
          {/* Toggle-style status */}
          <div style={{
            width: 36, height: 20, borderRadius: 10,
            backgroundColor: isConfirmed ? "#0E7B6C20" : "var(--surface-2)",
            position: "relative", cursor: "pointer",
            border: `1px solid ${isConfirmed ? "#0E7B6C30" : "var(--hairline)"}`,
          }}>
            <div style={{
              position: "absolute",
              top: 3,
              [isConfirmed ? "right" : "left"]: 3,
              width: 12, height: 12,
              borderRadius: "50%",
              backgroundColor: isConfirmed ? "#0E7B6C" : "var(--ink-tertiary)",
              transition: "all 150ms",
            }} />
          </div>
          <button style={{
            width: 28, height: 28, borderRadius: 8,
            border: "1px solid var(--hairline)",
            background: "var(--surface-1)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ink-tertiary)",
          }}>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {b.tags.map((tag) => (
          <span key={tag} style={{
            fontSize: 11, fontWeight: 600,
            color: color, backgroundColor: color + "15",
            padding: "3px 10px", borderRadius: 20,
          }}>
            {tag}
          </span>
        ))}
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: "var(--ink-tertiary)", backgroundColor: "var(--surface-2)",
          padding: "3px 10px", borderRadius: 20,
        }}>
          {b.duration} min
        </span>
      </div>

      {/* Footer: avatars + amount */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            backgroundColor: avatarColor(b.clientName),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "#fff",
            border: "2px solid var(--surface-1)",
          }}>
            {avatarInitials(b.clientName)}
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-secondary)", marginLeft: 6 }}>{b.clientName}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {b.amount} MAD
        </span>
      </div>
    </motion.div>
  );
}

function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }

export default function AgendaPage() {
  const { isMobile, isLg } = useBreakpoint();
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

  const adaptedBookings = bookings.length > 0
    ? bookings.map((b: any, i: number): typeof MOCK_BOOKINGS[0] => {
        const start = new Date(b.startDatetime);
        const end   = new Date(b.endDatetime ?? b.startDatetime);
        const color = MOCK_BOOKINGS[i % MOCK_BOOKINGS.length].color;
        return {
          id: b.id,
          clientName: b.client?.name ?? "Client",
          service: b.service?.name ?? "Prestation",
          time: `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
          duration: b.service?.durationMinutes ?? 60,
          amount: Math.round((b.amountCents ?? 0) / 100),
          status: b.status === "CONFIRMED" || b.status === "COMPLETED" ? "confirmed" : "pending",
          tags: [b.service?.category ?? "Prestation"],
          color,
        } as any;
      })
    : MOCK_BOOKINGS;

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
                style={{ fontSize: 12, fontWeight: 600, color: "#0E7B6C", padding: "5px 12px", borderRadius: 20, border: "1px solid #0E7B6C30", background: "#0E7B6C10", cursor: "pointer" }}
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
              { label: "RDV aujourd'hui", value: `${todayBookings || adaptedBookings.length}`, color: "#D4466E" },
              { label: "CA estimé",       value: `${adaptedBookings.reduce((s, b) => s + b.amount, 0).toLocaleString("fr-MA")} MAD`, color: "#0E7B6C" },
              { label: "Remplissage",     value: `${fillRate || 73}%`, color: "#8B5CF6" },
            ].map((s, i) => (
              <div key={i} className="ds-card" style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: "0 0 6px" }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Booking cards */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
              Réservations du jour
            </h3>
            <span style={{ fontSize: 12, color: "#0E7B6C", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              Tout voir <ArrowUpRight size={12} />
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
            {adaptedBookings.map((b, i) => (
              <BookingCard key={b.id} b={b as any} index={i} />
            ))}
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
              {adaptedBookings.map((b, i) => (
                <TimelineEvent key={b.id} b={b as any} index={i} />
              ))}
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
