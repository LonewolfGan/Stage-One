import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MyBooking } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/DSButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MapPin, AlertCircle, ChevronLeft, X } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmé", color: "#059669", bg: "#D1FAE5" },
  PENDING: { label: "En attente", color: "#D97706", bg: "#FEF3C7" },
  CANCELLED: { label: "Annulé", color: "#DC2626", bg: "#FEF2F2" },
  EXPIRED: { label: "Expiré", color: "#6B7280", bg: "#F3F4F6" },
  COMPLETED: { label: "Terminé", color: "#6B7280", bg: "#F3F4F6" },
};

function canCancel(booking: MyBooking): boolean {
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") return false;
  const hoursUntilStart = (new Date(booking.startDatetime).getTime() - Date.now()) / 3_600_000;
  return hoursUntilStart >= 2;
}

export default function AccountBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => api.getMyBookings(),
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => api.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
      setCancelTarget(null);
      setCancelError(null);
    },
    onError: (err: any) => {
      setCancelError(err?.data?.message ?? err?.message ?? "Erreur lors de l'annulation");
    },
  });

  const upcoming = bookings.filter((b) => new Date(b.startDatetime) >= new Date() && b.status !== "CANCELLED" && b.status !== "EXPIRED");
  const past = bookings.filter((b) => new Date(b.startDatetime) < new Date() || b.status === "CANCELLED" || b.status === "EXPIRED");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", paddingTop: 96 }}>
      <TopBar />

      <main>
        <div className="page-container" style={{ paddingTop: 48, paddingBottom: 96, maxWidth: 720 }}>

          <div style={{ marginBottom: 32 }}>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-tertiary)", textDecoration: "none", marginBottom: 16 }}
            >
              <ChevronLeft size={14} /> Accueil
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Mes réservations
            </h1>
          </div>

          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
              <div style={{ width: 36, height: 36, border: "2px solid var(--hairline)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}

          {isError && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-control)", color: "#DC2626", fontSize: 14 }}>
              <AlertCircle size={16} /> Impossible de charger vos réservations.
            </div>
          )}

          {!isLoading && !isError && bookings.length === 0 && (
            <div className="ds-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <Calendar size={32} style={{ color: "var(--ink-disabled)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Aucune réservation</h3>
              <p style={{ fontSize: 14, color: "var(--ink-tertiary)", marginBottom: 20 }}>Vous n'avez pas encore réservé de prestation.</p>
              <Link href="/search">
                <Button variant="primary" size="sm">Explorer les salons</Button>
              </Link>
            </div>
          )}

          {upcoming.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                À venir
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {upcoming.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onCancel={() => { setCancelTarget(b.id); setCancelError(null); }}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                Historique
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={() => { setCancelTarget(null); setCancelError(null); }}
        >
          <div
            className="ds-card"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>Annuler le rendez-vous ?</h3>
              <button onClick={() => { setCancelTarget(null); setCancelError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-secondary)", marginBottom: 20, lineHeight: 1.55 }}>
              Cette action est irréversible. Le créneau sera libéré et disponible à d'autres clients.
            </p>
            {cancelError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-control)", marginBottom: 16 }}>
                <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#DC2626" }}>{cancelError}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setCancelTarget(null); setCancelError(null); }}
                style={{ flex: 1, padding: "10px 16px", border: "1px solid var(--hairline)", borderRadius: "var(--radius-control)", background: "var(--canvas-pure)", fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: "pointer" }}
              >
                Garder le RDV
              </button>
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1, backgroundColor: "#DC2626", borderColor: "#DC2626" }}
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancelTarget)}
              >
                {cancelMutation.isPending ? "Annulation…" : "Confirmer l'annulation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: MyBooking; onCancel?: () => void }) {
  const start = new Date(booking.startDatetime);
  const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, color: "#6B7280", bg: "#F3F4F6" };
  const cancellable = onCancel && canCancel(booking);

  return (
    <div
      className="ds-card"
      style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
    >
      {/* Logo */}
      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "var(--surface-2)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {booking.providerLogoUrl ? (
          <img src={booking.providerLogoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Calendar size={18} style={{ color: "var(--ink-disabled)" }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {booking.providerName ?? "—"}
            </p>
            {booking.serviceName && (
              <p style={{ fontSize: 13, color: "var(--ink-secondary)", marginTop: 2 }}>
                {booking.serviceName}
                {booking.staffName ? ` · ${booking.staffName}` : ""}
              </p>
            )}
          </div>
          <span
            style={{
              display: "inline-block", padding: "3px 8px", borderRadius: 4,
              fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
              color: statusInfo.color, backgroundColor: statusInfo.bg,
              flexShrink: 0,
            }}
          >
            {statusInfo.label}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-tertiary)" }}>
            <Calendar size={12} />
            {format(start, "EEE d MMM yyyy", { locale: fr })}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-tertiary)" }}>
            <Clock size={12} />
            {format(start, "HH:mm", { locale: fr })}
            {booking.serviceDuration ? ` — ${booking.serviceDuration} min` : ""}
          </span>
          {booking.providerCity && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-tertiary)" }}>
              <MapPin size={12} /> {booking.providerCity}
            </span>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
            {(booking.amountCents / 100).toFixed(0)} MAD
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {booking.providerSlug && (
              <Link href={`/${booking.providerSlug}`} style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                Voir le salon
              </Link>
            )}
            {cancellable && (
              <button
                onClick={onCancel}
                style={{ fontSize: 13, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
