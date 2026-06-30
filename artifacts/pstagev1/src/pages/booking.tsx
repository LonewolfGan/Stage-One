import { useState, useMemo, useCallback, type FormEvent } from "react";
import { useParams, useSearch, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { StaffSelector } from "@/components/public/StaffSelector";
import { TimeSlotGrid } from "@/components/public/TimeSlotGrid";
import { Button } from "@/components/ui/DSButton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adaptProvider } from "@/lib/provider-adapter";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ChevronLeftIcon } from "@/components/ui/chevron-left";
import { ClockIcon } from "@/components/ui/clock";
import { CreditCardIcon } from "@/components/ui/credit-card";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useSlotSync } from "@/hooks/useSlotSync";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type BookingStep = "select" | "payment";

interface PendingBooking {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
  expiresAt: string;
  isMock: boolean;
}

// ── Stripe payment sub-form (uses hooks that require <Elements> context)
function StripePaymentForm({ bookingId, onError }: { bookingId: string; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation?id=${bookingId}`,
      },
    });
    if (error) {
      onError(error.message ?? "Erreur lors du paiement");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PaymentElement />
      <Button type="submit" variant="primary" size="lg" disabled={processing || !stripe} style={{ width: "100%" }}>
        {processing ? "Paiement en cours…" : "Payer maintenant"}
      </Button>
    </form>
  );
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(searchString);
  const serviceId = params.get("serviceId");
  const { isLg } = useBreakpoint();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>("select");
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [slotConflictWarning, setSlotConflictWarning] = useState(false);

  const dates = useMemo(() => {
    const arr: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const selectedDate = dates[selectedDateIndex];
  const dateStr = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);

  const { data: rawProvider, isLoading } = useQuery({
    queryKey: ["provider", slug],
    queryFn: () => api.getProvider(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const provider = rawProvider ? adaptProvider(rawProvider) : null;
  const selectedService =
    provider?.services.find((s) => s.id === serviceId) || provider?.services[0];

  const { data: apiSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", slug, selectedService?.id, dateStr, selectedStaffId],
    queryFn: () =>
      api.getSlots(slug!, {
        serviceId: selectedService!.id,
        date: dateStr,
        staffId: selectedStaffId ?? undefined,
      }),
    enabled: !!slug && !!selectedService,
    staleTime: 10_000,
  });

  const slotDatetimeMap = useMemo(() => {
    const map = new Map<string, string>();
    apiSlots.forEach((s) => map.set(s.startTime, s.startDatetime));
    return map;
  }, [apiSlots]);

  const slots = useMemo(
    () => apiSlots.map((s) => ({ time: s.startTime, available: true })),
    [apiSlots],
  );

  // Real-time slot conflict detection
  const handleSlotConflict = useCallback(
    (payload: { slotStart: string; staffId: string; change: "booked" | "released" }) => {
      if (selectedTime && payload.change === "booked") {
        const selectedDatetime = slotDatetimeMap.get(selectedTime);
        if (selectedDatetime && selectedDatetime === payload.slotStart) {
          setSlotConflictWarning(true);
          setSelectedTime(null);
        }
      }
    },
    [selectedTime, slotDatetimeMap],
  );

  useSlotSync(rawProvider?.id, dateStr, handleSlotConflict);

  const createBookingMutation = useMutation({
    mutationFn: () => {
      const startDatetime = slotDatetimeMap.get(selectedTime!) ?? "";
      return api.createBooking({
        providerSlug: slug!,
        serviceId: selectedService!.id,
        staffId: selectedStaffId ?? undefined,
        startDatetime,
      });
    },
    onSuccess: (result) => {
      setPendingBooking({
        bookingId: result.bookingId,
        clientSecret: result.paymentIntentSecret,
        amountCents: result.amountCents,
        expiresAt: result.expiresAt,
        isMock: result.isMock ?? true,
      });
      setBookingStep("payment");
      setBookingError(null);
    },
    onError: (err: any) => {
      setBookingError(err?.data?.message ?? err?.message ?? "Erreur lors de la réservation");
    },
  });

  const confirmMockMutation = useMutation({
    mutationFn: () => api.confirmBooking(pendingBooking!.bookingId),
    onSuccess: () => {
      navigate(`/booking/confirmation?id=${pendingBooking!.bookingId}`);
    },
    onError: (err: any) => {
      setBookingError(err?.data?.message ?? "Erreur lors de la confirmation");
    },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid var(--hairline)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!provider || !selectedService) return null;

  const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  // ── Payment panel
  const paymentPanel = pendingBooking && (
    <motion.div
      className="ds-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <CreditCard size={18} style={{ color: "var(--ink-secondary)" }} />
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          Paiement
        </h2>
      </div>

      <div
        style={{
          backgroundColor: "var(--surface-2)",
          borderRadius: "var(--radius-control)",
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>{selectedService.name}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
          {(pendingBooking.amountCents / 100).toFixed(0)} MAD
        </span>
      </div>

      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "var(--surface-2)",
          borderRadius: "var(--radius-control)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Clock size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>
          Créneau réservé pendant 10 minutes
        </span>
      </div>

      {bookingError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-control)", marginBottom: 16 }}>
          <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#DC2626" }}>{bookingError}</span>
        </div>
      )}

      {stripePromise && !pendingBooking.isMock ? (
        <Elements stripe={stripePromise} options={{ clientSecret: pendingBooking.clientSecret }}>
          <StripePaymentForm bookingId={pendingBooking.bookingId} onError={setBookingError} />
        </Elements>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: "12px 16px",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              backgroundColor: "var(--surface-2)",
              fontSize: 13,
              color: "var(--ink-tertiary)",
            }}
          >
            Mode développement — paiement simulé
          </div>
          <Button
            variant="primary"
            size="lg"
            style={{ width: "100%" }}
            disabled={confirmMockMutation.isPending}
            onClick={() => confirmMockMutation.mutate()}
          >
            {confirmMockMutation.isPending ? "Confirmation…" : "Simuler le paiement"}
          </Button>
        </div>
      )}

      <button
        onClick={() => { setBookingStep("select"); setBookingError(null); }}
        style={{
          marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5,
          background: "none", border: "1px solid rgba(10,10,15,0.14)", cursor: "pointer",
          fontSize: 13, color: "var(--ink-secondary)", borderRadius: 9999,
          padding: "6px 14px", fontFamily: "var(--font)", letterSpacing: "-0.01em",
          transition: "border-color 140ms",
        }}
      >
        <ChevronLeft size={13} /> Modifier la sélection
      </button>
    </motion.div>
  );

  // ── Summary + confirm card
  const summaryCard = (
    <div className="ds-card" style={{ position: isLg ? "sticky" : "static", top: 96 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--hairline)" }}>
        Récapitulatif
      </h2>

      {slotConflictWarning && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: "#FFFBEB", borderRadius: "var(--radius-control)", marginBottom: 16, border: "1px solid #FCD34D" }}>
          <AlertCircle size={13} style={{ color: "#D97706", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#D97706" }}>Ce créneau vient d'être pris. Veuillez en choisir un autre.</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Établissement", value: provider.name },
          { label: "Prestation", value: selectedService.name },
          ...(selectedStaffId
            ? [{ label: "Professionnel", value: provider.staff.find((s) => s.id === selectedStaffId)?.firstName || "" }]
            : []),
          ...(selectedTime
            ? [{ label: "Date", value: `${selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${selectedTime}` }]
            : []),
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--ink-tertiary)", flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {(selectedService.priceCents / 100).toFixed(0)} MAD
        </span>
      </div>

      {bookingError && bookingStep === "select" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: "#FEF2F2", borderRadius: "var(--radius-control)", marginBottom: 16 }}>
          <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#DC2626" }}>{bookingError}</span>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        disabled={!selectedTime || createBookingMutation.isPending}
        style={{ width: "100%" }}
        onClick={() => {
          setBookingError(null);
          setSlotConflictWarning(false);
          createBookingMutation.mutate();
        }}
      >
        {createBookingMutation.isPending ? "Réservation en cours…" : "Confirmer le rendez-vous"}
      </Button>

      {selectedTime && (
        <p style={{ fontSize: 12, color: "var(--ink-tertiary)", textAlign: "center", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Clock size={12} />
          Ce créneau est bloqué pendant 10 minutes
        </p>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)" }}>
      <TopBar />

      <main>
        <div
          className="page-container"
          style={{
            paddingTop: 40,
            paddingBottom: 96,
            display: "grid",
            gridTemplateColumns: isLg ? "repeat(12, 1fr)" : "1fr",
            gap: isLg ? 32 : 24,
          }}
        >
          {/* Left — booking form */}
          <div style={{ gridColumn: isLg ? "1 / 9" : "1", display: "flex", flexDirection: "column", gap: 16 }}>
            <Link
              href={`/${provider.slug}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                alignSelf: "flex-start",
                fontSize: 13, color: "var(--ink)", textDecoration: "none",
                background: "transparent", border: "1px solid rgba(10,10,15,0.18)", borderRadius: 9999,
                padding: "7px 14px", marginBottom: 8,
                fontWeight: 500, letterSpacing: "-0.01em",
                transition: "border-color 140ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(10,10,15,0.45)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(10,10,15,0.18)"; }}
            >
              <ChevronLeft size={14} /> Retour
            </Link>

            <AnimatePresence mode="wait">
              {bookingStep === "select" ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Prestation */}
                  <div className="ds-card">
                    <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 16 }}>
                      1. Prestation sélectionnée
                    </h2>
                    <div style={{ backgroundColor: "rgba(12,12,14,0.04)", borderRadius: "var(--radius-control)", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>{selectedService.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginTop: 2 }}>{selectedService.durationMinutes} min</p>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>
                        {(selectedService.priceCents / 100).toFixed(0)} MAD
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 12 }}>Avec qui ?</h3>
                    <StaffSelector
                      staff={provider.staff.filter((s) => selectedService.staffIds.includes(s.id))}
                      selectedStaffId={selectedStaffId}
                      onSelectStaff={setSelectedStaffId}
                    />
                  </div>

                  {/* Date & heure */}
                  <div className="ds-card">
                    <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 20 }}>
                      2. Date et heure
                    </h2>

                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 20 }}>
                      {dates.map((date, idx) => {
                        const isSelected = selectedDateIndex === idx;
                        const hours = provider.businessHours.find((h) => h.dayOfWeek === date.getDay());
                        const isClosed = !hours || hours.isClosed;
                        return (
                          <button
                            key={idx}
                            disabled={isClosed}
                            onClick={() => { setSelectedDateIndex(idx); setSelectedTime(null); setSlotConflictWarning(false); }}
                            style={{
                              flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                              width: 60, height: 72, borderRadius: "var(--radius-control)",
                              border: `1px solid ${isSelected ? "var(--ink)" : isClosed ? "var(--hairline)" : "var(--hairline-strong)"}`,
                              backgroundColor: isSelected ? "var(--ink)" : "transparent",
                              color: isSelected ? "#FFFFFF" : isClosed ? "var(--ink-disabled)" : "var(--ink)",
                              cursor: isClosed ? "not-allowed" : "pointer",
                              opacity: isClosed ? 0.5 : 1,
                              transition: "border-color var(--ease), background-color var(--ease)",
                              fontFamily: "var(--font)",
                            }}
                            onMouseEnter={(e) => { if (!isClosed && !isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(12,12,14,0.40)"; }}
                            onMouseLeave={(e) => { if (!isClosed && !isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline-strong)"; }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, marginBottom: 4 }}>
                              {DAY_NAMES[date.getDay()]}
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 600 }}>{date.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>

                    <TimeSlotGrid slots={slots} selectedSlot={selectedTime} onSelectSlot={(t) => { setSelectedTime(t); setSlotConflictWarning(false); }} />
                  </div>

                  {/* Summary inline on mobile */}
                  {!isLg && summaryCard}
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
                >
                  {paymentPanel}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar — desktop only */}
          {isLg && (
            <div style={{ gridColumn: "9 / 13" }}>
              {bookingStep === "select" ? summaryCard : paymentPanel}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
