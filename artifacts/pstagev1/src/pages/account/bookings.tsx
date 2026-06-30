import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MyBooking } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/DSButton";
import { StatusBadge, type BookingStatus } from "@/components/ui/status-badge";
import { ds } from "@/lib/design-system";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, AlertCircle, Star, X, ChevronLeft, Clock, MapPin } from "lucide-react";

function canCancel(booking: MyBooking): boolean {
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") return false;
  const hoursUntilStart = (new Date(booking.startDatetime).getTime() - Date.now()) / 3_600_000;
  return hoursUntilStart >= 2;
}

function canReview(booking: MyBooking): boolean {
  if (booking.hasReview) return false;
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") return false;
  return new Date(booking.endDatetime) < new Date();
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
        >
          <Star
            size={24}
            fill={(hovered || value) >= star ? ds.colors.rating : "none"}
            stroke={(hovered || value) >= star ? ds.colors.rating : ds.colors.borderStrong}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function AccountBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget]   = useState<string | null>(null);
  const [cancelError, setCancelError]     = useState<string | null>(null);
  const [reviewTarget, setReviewTarget]   = useState<string | null>(null);
  const [reviewRating, setReviewRating]   = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError]     = useState<string | null>(null);

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn:  () => api.getMyBookings(),
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
      setCancelTarget(null);
      setCancelError(null);
    },
    onError: (err: any) => {
      setCancelError(err?.data?.message ?? err?.message ?? "Erreur lors de l'annulation");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ bookingId, rating, comment }: { bookingId: string; rating: number; comment: string }) =>
      api.createReview({ bookingId, rating, comment: comment || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
      setReviewTarget(null);
      setReviewRating(0);
      setReviewComment("");
      setReviewError(null);
    },
    onError: (err: any) => {
      setReviewError(err?.data?.message ?? err?.message ?? "Erreur lors de l'envoi");
    },
  });

  function openReview(id: string) {
    setReviewTarget(id);
    setReviewRating(0);
    setReviewComment("");
    setReviewError(null);
  }

  function submitReview() {
    if (!reviewTarget || reviewRating === 0) {
      setReviewError("Veuillez sélectionner une note.");
      return;
    }
    reviewMutation.mutate({ bookingId: reviewTarget, rating: reviewRating, comment: reviewComment });
  }

  const upcoming = bookings.filter(
    (b) => new Date(b.startDatetime) >= new Date() && b.status !== "CANCELLED" && b.status !== "EXPIRED",
  );
  const past = bookings.filter(
    (b) => new Date(b.startDatetime) < new Date() || b.status === "CANCELLED" || b.status === "EXPIRED",
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: ds.colors.canvas, paddingTop: 96 }}>
      <TopBar />

      <main>
        <div className="page-container" style={{ paddingTop: 48, paddingBottom: 96, maxWidth: 720 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: ds.colors.inkTertiary, textDecoration: "none", marginBottom: 16 }}
            >
              <ChevronLeft size={14} /> Accueil
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: ds.colors.ink, letterSpacing: "-0.02em", margin: 0 }}>
              Mes réservations
            </h1>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${ds.colors.canvasMuted}`, borderTopColor: ds.colors.ink, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", backgroundColor: ds.colors.errorBg, borderRadius: 8, color: ds.colors.error, fontSize: 14 }}>
              <AlertCircle size={16} /> Impossible de charger vos réservations.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && bookings.length === 0 && (
            <div className="ds-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <Calendar size={32} style={{ color: ds.colors.inkTertiary, margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: ds.colors.ink, marginBottom: 8 }}>Aucune réservation</h3>
              <p style={{ fontSize: 14, color: ds.colors.inkTertiary, marginBottom: 20 }}>
                Vous n'avez pas encore réservé de prestation.
              </p>
              <Link href="/search">
                <Button variant="primary" size="sm">Explorer les salons</Button>
              </Link>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 11, fontWeight: 600, color: ds.colors.inkTertiary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>
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

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 600, color: ds.colors.inkTertiary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>
                Historique
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {past.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onReview={canReview(b) ? () => openReview(b.id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Cancel dialog ── */}
      {cancelTarget && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => { setCancelTarget(null); setCancelError(null); }}
        >
          <div className="ds-card" style={{ maxWidth: 400, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: ds.colors.ink, margin: 0 }}>Annuler le rendez-vous ?</h3>
              <button onClick={() => { setCancelTarget(null); setCancelError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: ds.colors.inkTertiary, display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: ds.colors.inkSecondary, marginBottom: 20, lineHeight: 1.55 }}>
              Cette action est irréversible. Le créneau sera libéré et disponible à d'autres clients.
            </p>
            {cancelError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: ds.colors.errorBg, borderRadius: 8, marginBottom: 16 }}>
                <AlertCircle size={14} style={{ color: ds.colors.error, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: ds.colors.error }}>{cancelError}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setCancelTarget(null); setCancelError(null); }}
                style={{ flex: 1, padding: "10px 16px", border: `1px solid ${ds.colors.border}`, borderRadius: 8, background: ds.colors.canvas, fontSize: 14, fontWeight: 500, color: ds.colors.ink, cursor: "pointer" }}
              >
                Garder le RDV
              </button>
              <button
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancelTarget)}
                style={{
                  flex: 1, padding: "10px 16px", border: "none", borderRadius: 8,
                  background: ds.colors.error, fontSize: 14, fontWeight: 500,
                  color: ds.colors.canvas, cursor: cancelMutation.isPending ? "not-allowed" : "pointer",
                  opacity: cancelMutation.isPending ? 0.65 : 1, transition: "opacity 140ms",
                }}
              >
                {cancelMutation.isPending ? "Annulation…" : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review modal ── */}
      {reviewTarget && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setReviewTarget(null)}
        >
          <div className="ds-card" style={{ maxWidth: 440, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: ds.colors.ink, margin: 0 }}>Laisser un avis</h3>
              <button onClick={() => setReviewTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: ds.colors.inkTertiary, display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: ds.colors.inkTertiary, marginBottom: 10 }}>Note globale</p>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
              {reviewRating > 0 && (
                <p style={{ fontSize: 12, color: ds.colors.inkTertiary, marginTop: 6, margin: "6px 0 0" }}>
                  {["", "Très mauvais", "Mauvais", "Correct", "Bien", "Excellent"][reviewRating]}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: ds.colors.inkTertiary, display: "block", marginBottom: 8 }}>
                Commentaire <span style={{ fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Décrivez votre expérience…"
                maxLength={1000}
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14, lineHeight: 1.55,
                  border: `1px solid ${ds.colors.border}`, borderRadius: 8,
                  backgroundColor: ds.colors.canvas, color: ds.colors.ink,
                  resize: "vertical", outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: ds.colors.inkTertiary, marginTop: 4, textAlign: "right", margin: "4px 0 0" }}>
                {reviewComment.length}/1000
              </p>
            </div>

            {reviewError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: ds.colors.errorBg, borderRadius: 8, marginBottom: 16 }}>
                <AlertCircle size={14} style={{ color: ds.colors.error, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: ds.colors.error }}>{reviewError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setReviewTarget(null)}
                style={{ flex: 1, padding: "10px 16px", border: `1px solid ${ds.colors.border}`, borderRadius: 8, background: ds.colors.canvas, fontSize: 14, fontWeight: 500, color: ds.colors.ink, cursor: "pointer" }}
              >
                Annuler
              </button>
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
                disabled={reviewRating === 0 || reviewMutation.isPending}
                onClick={submitReview}
              >
                {reviewMutation.isPending ? "Envoi…" : "Publier l'avis"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── BookingCard ── */
function BookingCard({
  booking,
  onCancel,
  onReview,
}: {
  booking:   MyBooking;
  onCancel?: () => void;
  onReview?: () => void;
}) {
  const start       = new Date(booking.startDatetime);
  const cancellable = onCancel && canCancel(booking);

  return (
    <div className="ds-card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Logo */}
      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: ds.colors.canvasMuted, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {booking.providerLogoUrl ? (
          <img src={booking.providerLogoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Calendar size={18} style={{ color: ds.colors.inkTertiary }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: ds.colors.ink, letterSpacing: "-0.01em", margin: 0 }}>
              {booking.providerName ?? "—"}
            </p>
            {booking.serviceName && (
              <p style={{ fontSize: 13, color: ds.colors.inkSecondary, marginTop: 2, marginBottom: 0 }}>
                {booking.serviceName}{booking.staffName ? ` · ${booking.staffName}` : ""}
              </p>
            )}
          </div>
          <StatusBadge status={booking.status as BookingStatus} size="md" />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: ds.colors.inkTertiary }}>
            <Calendar size={12} />
            {format(start, "EEE d MMM yyyy", { locale: fr })}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: ds.colors.inkTertiary }}>
            <Clock size={12} />
            {format(start, "HH:mm", { locale: fr })}
            {booking.serviceDuration ? ` — ${booking.serviceDuration} min` : ""}
          </span>
          {booking.providerCity && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: ds.colors.inkTertiary }}>
              <MapPin size={12} /> {booking.providerCity}
            </span>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: ds.colors.ink, letterSpacing: "-0.02em" }}>
            {(booking.amountCents / 100).toFixed(0)} MAD
          </span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {booking.providerSlug && (
              <Link href={`/${booking.providerSlug}`} style={{ fontSize: 13, color: ds.colors.ink, textDecoration: "none", fontWeight: 500 }}>
                Voir le salon
              </Link>
            )}
            {booking.hasReview && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: ds.colors.inkTertiary }}>
                <Star size={12} fill={ds.colors.rating} stroke={ds.colors.rating} /> Noté
              </span>
            )}
            {onReview && (
              <button
                onClick={onReview}
                style={{ fontSize: 13, color: ds.colors.inkSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
              >
                Laisser un avis
              </button>
            )}
            {cancellable && (
              <button
                onClick={onCancel}
                style={{ fontSize: 13, color: ds.colors.error, background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
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
