import { useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { CheckCircle2, Calendar, MapPin, Clock, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function BookingConfirmationPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const bookingId = params.get("id") ?? params.get("bookingId") ?? "";

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => api.getBooking(bookingId),
    enabled: !!bookingId,
    retry: 3,
    retryDelay: 1000,
  });

  if (!bookingId) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", paddingTop: 96 }}>
        <TopBar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)" }}>Réservation introuvable.</p>
          <Link href="/" style={{ color: "var(--accent)", fontSize: 13 }}>Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", paddingTop: 96 }}>
        <TopBar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ width: 36, height: 36, border: "2px solid var(--hairline)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", paddingTop: 96 }}>
        <TopBar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)" }}>Impossible de charger les détails de la réservation.</p>
          <Link href="/" style={{ color: "var(--accent)", fontSize: 13 }}>Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const isConfirmed = booking.status === "CONFIRMED";
  const start = new Date(booking.startDatetime);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", paddingTop: 96 }}>
      <TopBar />

      <main>
        <div className="page-container" style={{ paddingTop: 64, paddingBottom: 96, maxWidth: 560, margin: "0 auto" }}>

          {/* Status banner */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                backgroundColor: isConfirmed ? "#D1FAE5" : "var(--surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={28} style={{ color: isConfirmed ? "#059669" : "var(--ink-tertiary)" }} />
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 8 }}>
              {isConfirmed ? "Rendez-vous confirmé" : "Réservation en attente"}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink-secondary)", lineHeight: 1.55 }}>
              {isConfirmed
                ? "Votre rendez-vous est confirmé. Vous recevrez un rappel avant votre séance."
                : "Votre paiement est en cours de traitement. La confirmation arrivera sous peu."}
            </p>
          </div>

          {/* Booking card */}
          <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {booking.providerName && (
              <div>
                <p style={{ fontSize: 12, color: "var(--ink-tertiary)", marginBottom: 4, letterSpacing: "0.01em" }}>ÉTABLISSEMENT</p>
                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{booking.providerName}</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Calendar size={15} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "var(--ink)" }}>
                  {format(start, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
              </div>

              {booking.serviceName && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Clock size={15} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>
                    {booking.serviceName}
                    {booking.serviceDuration ? ` — ${booking.serviceDuration} min` : ""}
                  </span>
                </div>
              )}

              {booking.providerCity && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={15} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>
                    {booking.providerAddress ? `${booking.providerAddress}, ` : ""}{booking.providerCity}
                  </span>
                </div>
              )}
            </div>

            <div style={{ paddingTop: 16, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Montant réglé</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
                {(booking.amountCents / 100).toFixed(0)} MAD
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {booking.providerSlug && (
              <Link
                href={`/${booking.providerSlug}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "12px 20px", border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)", fontSize: 14, fontWeight: 500,
                  color: "var(--ink)", textDecoration: "none", backgroundColor: "var(--canvas-pure)",
                  transition: "border-color var(--ease), background-color var(--ease)",
                }}
              >
                Voir la fiche du salon
              </Link>
            )}
            <Link
              href="/account/bookings"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "12px 20px", fontSize: 13, color: "var(--ink-tertiary)",
                textDecoration: "none",
              }}
            >
              <ChevronLeft size={13} /> Mes réservations
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
