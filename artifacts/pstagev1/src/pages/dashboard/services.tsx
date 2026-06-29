import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api } from "@/lib/api";
import { Plus, Clock, Pencil, Tag } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
}

/* ── Service Card ──────────────────────────────────────────── */
function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: [0, 0, 0.2, 1] }}
      style={{
        borderRadius: 12,
        border: "1px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        display: "flex",
        flexDirection: "column",
        padding: "18px 20px 16px",
        gap: 10,
        transition: "border-color 150ms ease, background-color 150ms ease",
        cursor: "default",
      }}
      onHoverStart={(e) => {
        (e.target as HTMLElement).closest?.("[data-card]") &&
          ((e.target as HTMLElement).closest("[data-card]") as HTMLElement)?.style &&
          null;
      }}
      whileHover={{ backgroundColor: "rgba(12,12,14,0.015)" }}
    >
      {/* Name + duration */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
            margin: 0,
            flex: 1,
            textWrap: "balance",
          } as React.CSSProperties}
        >
          {service.name}
        </p>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            backgroundColor: "rgba(12,12,14,0.05)",
            borderRadius: 9999,
            padding: "3px 8px",
            whiteSpace: "nowrap",
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          <Clock size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
          {service.durationMinutes} min
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 12,
          color: "var(--ink-tertiary)",
          lineHeight: 1.55,
          margin: 0,
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: 37,
        }}
      >
        {service.description || (
          <span style={{ opacity: 0.5, fontStyle: "italic" }}>Pas de description</span>
        )}
      </p>

      {/* Footer — price + action */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTop: "1px solid var(--hairline)",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          {Math.round(service.priceCents / 100)}{" "}
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: "var(--ink-tertiary)",
              letterSpacing: 0,
            }}
          >
            MAD
          </span>
        </span>

        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            height: 28,
            paddingInline: 12,
            backgroundColor: "var(--ink)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            cursor: "pointer",
            fontFamily: "var(--font)",
            flexShrink: 0,
            transition: "opacity 140ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.80"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Pencil size={10} strokeWidth={2} />
          Modifier
        </button>
      </div>
    </motion.div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--hairline)",
        padding: "18px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ height: 14, width: "52%", borderRadius: 5, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 20, width: 60, borderRadius: 9999, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{ height: 12, width: "82%", borderRadius: 4, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 12, width: "62%", borderRadius: 4, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 17, width: 72, borderRadius: 5, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 28, width: 76, borderRadius: 7, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ServicesPage() {
  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const raw: any[] = providerData?.services ?? [];
  const services: Service[] = raw.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    durationMinutes: s.durationMinutes ?? 0,
    priceCents: s.priceCents ?? 0,
  }));

  const totalCount = services.length;
  const avgDuration =
    totalCount > 0
      ? Math.round(services.reduce((a, s) => a + s.durationMinutes, 0) / totalCount)
      : 0;
  const avgPrice =
    totalCount > 0
      ? Math.round(services.reduce((a, s) => a + s.priceCents, 0) / totalCount / 100)
      : 0;

  return (
    <DashboardLayout
      title="Prestations"
      breadcrumb="Prestations"
      actions={
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>
          Ajouter
        </Button>
      }
    >
      {/* Stats — compact inline strip, pas de hero-metric */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0,
          border: "1px solid var(--hairline)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 28,
        }}
      >
        {[
          { label: "Prestations", value: isLoading ? "—" : String(totalCount) },
          { label: "Durée moy.", value: isLoading ? "—" : `${avgDuration} min` },
          { label: "Prix moy.", value: isLoading ? "—" : `${avgPrice} MAD` },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              padding: "10px 20px",
              borderRight: i < arr.length - 1 ? "1px solid var(--hairline)" : "none",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--ink-tertiary)",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "80px 24px",
            border: "1px dashed var(--hairline-strong)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: "rgba(12,12,14,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Tag size={18} color="var(--ink-tertiary)" strokeWidth={1.5} />
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 4px",
                letterSpacing: "-0.01em",
              }}
            >
              Aucune prestation
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
              Ajoutez votre première prestation pour qu'elle apparaisse ici.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={13} />}>
            Ajouter une prestation
          </Button>
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <AnimatePresence mode="popLayout">
            {services.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
