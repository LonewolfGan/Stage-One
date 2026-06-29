import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api } from "@/lib/api";
import { Plus, Search, X, Clock, Tag } from "lucide-react";

/* ── Types ── */
interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
}

/* ── Service Card ─────────────────────────────────── */
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: [0, 0, 0.2, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        /* Outer shell — double-bezel */
        borderRadius: 16,
        border: "1px solid",
        borderColor: hovered ? "rgba(212,70,110,0.20)" : "var(--hairline)",
        padding: 2,
        backgroundColor: hovered ? "rgba(212,70,110,0.025)" : "var(--surface-1)",
        boxShadow: hovered
          ? "0 6px 24px rgba(212,70,110,0.09), 0 2px 6px rgba(12,12,14,0.05)"
          : "0 1px 4px rgba(12,12,14,0.04)",
        transition: "box-shadow 320ms cubic-bezier(0.32,0.72,0,1), border-color 320ms ease, background-color 320ms ease",
        cursor: "default",
      }}
    >
      {/* Inner core */}
      <div
        style={{
          borderRadius: 14,
          padding: "18px 18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: "100%",
        }}
      >
        {/* Top — name + duration */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              margin: 0,
              flex: 1,
            }}
          >
            {service.name}
          </h3>

          {/* Duration pill */}
          <span
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              backgroundColor: "rgba(12,12,14,0.06)",
              borderRadius: 9999,
              padding: "4px 9px",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            <Clock size={10} strokeWidth={2} />
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
            minHeight: 36,
          }}
        >
          {service.description || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Aucune description</span>}
        </p>

        {/* Bottom — price */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {Math.round(service.priceCents / 100)}{" "}
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", letterSpacing: 0 }}>
              MAD
            </span>
          </span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{
              height: 30,
              paddingInline: 14,
              backgroundColor: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              fontFamily: "var(--font)",
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
          >
            Modifier
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Skeleton card ─────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid var(--hairline)",
        padding: "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        backgroundColor: "var(--surface-1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 15, width: "55%", borderRadius: 6, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 22, width: 70, borderRadius: 9999, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ height: 12, width: "80%", borderRadius: 5, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ height: 12, width: "60%", borderRadius: 5, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 20, width: 80, borderRadius: 6, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 30, width: 70, borderRadius: 9999, backgroundColor: "var(--surface-2)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────── */
export default function ServicesPage() {
  const [search, setSearch] = useState("");

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const raw: any[] = providerData?.services ?? [];
  const allServices: Service[] = raw.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    durationMinutes: s.durationMinutes ?? 0,
    priceCents: s.priceCents ?? 0,
  }));

  /* Stats */
  const totalCount = allServices.length;
  const avgDuration =
    totalCount > 0
      ? Math.round(allServices.reduce((a, s) => a + s.durationMinutes, 0) / totalCount)
      : 0;
  const avgPrice =
    totalCount > 0
      ? Math.round(allServices.reduce((a, s) => a + s.priceCents, 0) / totalCount / 100)
      : 0;

  /* Filter */
  const filtered = allServices.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Prestations"
      breadcrumb="Prestations"
      actions={
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>
          Ajouter une prestation
        </Button>
      }
    >
      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Prestations", value: isLoading ? "…" : String(totalCount) },
          { label: "Durée moyenne", value: isLoading ? "…" : `${avgDuration} min` },
          { label: "Prix moyen", value: isLoading ? "…" : `${avgPrice} MAD` },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              padding: "14px 18px",
              backgroundColor: "var(--surface-1)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 320 }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-tertiary)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Rechercher une prestation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            height: 36,
            paddingLeft: 32,
            paddingRight: search ? 32 : 12,
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            backgroundColor: "var(--surface-1)",
            fontSize: 13,
            color: "var(--ink)",
            outline: "none",
            fontFamily: "var(--font)",
            boxSizing: "border-box",
            transition: "border-color 160ms ease",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-tertiary)",
              padding: 2,
              display: "flex",
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "72px 24px",
            border: "1px dashed var(--hairline-strong)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Tag size={20} color="var(--ink-tertiary)" strokeWidth={1.5} />
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
              {search ? `Aucun résultat pour « ${search} »` : "Aucune prestation"}
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
              {search ? "Essayez un autre mot-clé" : "Ajoutez votre première prestation"}
            </p>
          </div>
          {!search && (
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Ajouter une prestation
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
