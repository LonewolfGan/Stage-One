import { useState, useMemo } from "react";
import { useParams, useSearch, Link } from "wouter";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { StaffSelector } from "@/components/public/StaffSelector";
import { TimeSlotGrid } from "@/components/public/TimeSlotGrid";
import { Button } from "@/components/ui/DSButton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adaptProvider } from "@/lib/provider-adapter";
import { ChevronLeft, Clock } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const serviceId = params.get("serviceId");
  const { isLg } = useBreakpoint();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dates = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const selectedDate = dates[selectedDateIndex];

  const { data: rawProvider, isLoading } = useQuery({
    queryKey: ["provider", slug],
    queryFn: () => api.getProvider(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const provider = rawProvider ? adaptProvider(rawProvider) : null;
  const selectedService =
    provider?.services.find((s) => s.id === serviceId) || provider?.services[0];

  const dateStr = useMemo(
    () => selectedDate.toISOString().slice(0, 10),
    [selectedDate]
  );

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

  const slots = useMemo(
    () =>
      apiSlots.map((s) => ({
        time: s.startTime,
        available: true,
      })),
    [apiSlots]
  );

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid var(--hairline)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!provider || !selectedService) return null;

  const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const summaryCard = (
    <div
      className="ds-card"
      style={{ position: isLg ? "sticky" : "static", top: 96 }}
    >
      <h2
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        Récapitulatif
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Établissement", value: provider.name },
          { label: "Prestation", value: selectedService.name },
          ...(selectedStaffId
            ? [
                {
                  label: "Professionnel",
                  value:
                    provider.staff.find((s) => s.id === selectedStaffId)
                      ?.firstName || "",
                },
              ]
            : []),
          ...(selectedTime
            ? [
                {
                  label: "Date",
                  value: `${selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })} à ${selectedTime}`,
                },
              ]
            : []),
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
          >
            <span style={{ fontSize: 13, color: "var(--ink-tertiary)", flexShrink: 0 }}>
              {label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", textAlign: "right" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--hairline)",
          paddingTop: 16,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {(selectedService.priceCents / 100).toFixed(0)} MAD
        </span>
      </div>

      <Button
        variant="primary"
        size="lg"
        disabled={!selectedTime}
        style={{ width: "100%" }}
        onClick={() => alert("Réservation confirmée ! (Mock)")}
      >
        Confirmer le rendez-vous
      </Button>

      {selectedTime && (
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-tertiary)",
            textAlign: "center",
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Clock size={12} />
          Ce créneau est bloqué pendant 10 minutes
        </p>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--canvas)", paddingTop: 96 }}>
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
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                color: "var(--ink-tertiary)",
                textDecoration: "none",
                marginBottom: 8,
                transition: "color var(--ease)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-tertiary)";
              }}
            >
              <ChevronLeft size={14} /> Retour
            </Link>

            {/* Prestation sélectionnée */}
            <motion.div
              className="ds-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: 16,
                }}
              >
                1. Prestation sélectionnée
              </h2>
              <div
                style={{
                  backgroundColor: "rgba(12,12,14,0.04)",
                  borderRadius: "var(--radius-control)",
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                    {selectedService.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--ink-tertiary)", marginTop: 2 }}>
                    {selectedService.durationMinutes} min
                  </p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>
                  {(selectedService.priceCents / 100).toFixed(0)} MAD
                </span>
              </div>

              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: 12,
                }}
              >
                Avec qui ?
              </h3>
              <StaffSelector
                staff={provider.staff.filter((s) =>
                  selectedService.staffIds.includes(s.id)
                )}
                selectedStaffId={selectedStaffId}
                onSelectStaff={setSelectedStaffId}
              />
            </motion.div>

            {/* Date & heure */}
            <motion.div
              className="ds-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: 20,
                }}
              >
                2. Date et heure
              </h2>

              {/* Date picker */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 16,
                  marginBottom: 20,
                }}
              >
                {dates.map((date, idx) => {
                  const isSelected = selectedDateIndex === idx;
                  const hours = provider.businessHours.find(
                    (h) => h.dayOfWeek === date.getDay()
                  );
                  const isClosed = !hours || hours.isClosed;

                  return (
                    <button
                      key={idx}
                      disabled={isClosed}
                      onClick={() => {
                        setSelectedDateIndex(idx);
                        setSelectedTime(null);
                      }}
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 60,
                        height: 72,
                        borderRadius: "var(--radius-control)",
                        border: `1px solid ${
                          isSelected
                            ? "var(--accent)"
                            : isClosed
                            ? "var(--hairline)"
                            : "var(--hairline-strong)"
                        }`,
                        backgroundColor: isSelected ? "var(--accent-tint)" : "transparent",
                        color: isSelected
                          ? "var(--accent)"
                          : isClosed
                          ? "var(--ink-disabled)"
                          : "var(--ink)",
                        cursor: isClosed ? "not-allowed" : "pointer",
                        opacity: isClosed ? 0.5 : 1,
                        transition: "border-color var(--ease), background-color var(--ease)",
                        fontFamily: "var(--font)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isClosed && !isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isClosed && !isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline-strong)";
                        }
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, marginBottom: 4 }}>
                        {DAY_NAMES[date.getDay()]}
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 600 }}>
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <TimeSlotGrid
                slots={slots}
                selectedSlot={selectedTime}
                onSelectSlot={setSelectedTime}
              />
            </motion.div>

            {/* Summary card inline on mobile */}
            {!isLg && summaryCard}
          </div>

          {/* Récapitulatif — sidebar on desktop only */}
          {isLg && (
            <div style={{ gridColumn: "9 / 13" }}>
              {summaryCard}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
